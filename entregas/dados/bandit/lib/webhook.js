// Webhook de venda: a fonte única de venda. Um adaptador por plataforma.
// O que NÃO foi confirmado na documentação oficial da plataforma está
// marcado `confirmado: false` e aparece assim na aba Configurações.
import crypto from 'node:crypto';
import { agora } from './db.js';
import { leConfig, igualSeguro, hashEmail, hashTel, mapaCampos, pega, textos } from './util.js';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const APROVADO = /^(paid|approved|aprovad[oa]|complete[d]?|purchase_approved|purchase_complete|order_approved|order\.paid|compra_aprovada|venda_aprovada|pago|autorizad[oa]|3)$/i;
const REEMBOLSO = /^(refunded|reembolsad[oa]|purchase_refunded|order_refunded|order\.refunded|reembolso|devolvid[oa]|7)$/i;
const CHARGEBACK = /^(chargeback|chargedback|charged_back|purchase_chargeback|order\.chargeback|contestad[oa])$/i;

export const PLATAFORMAS = {
  hotmart: {
    nome: 'Hotmart', confirmado: true,
    auth: { modo: 'token_cabecalho', cabecalho: 'x-hotmart-hottok' },
    parametro: 'sck',
    pedido: ['data.purchase.transaction'], produto: ['data.product.id'],
    status: ['data.purchase.status', 'event'], evento: ['event'],
    email: ['data.buyer.email'], tel: ['data.buyer.checkout_phone', 'data.buyer.phone'],
    reais: ['data.purchase.full_price.value', 'data.purchase.price.value'], itens: null, centavos: [],
    teste: () => false,
    passos: ['Hotmart: Ferramentas > Webhook (API e notificações) > Cadastrar webhook.',
      'Cole a URL abaixo, versão 2.0.0.',
      'Marque: Compra aprovada, Compra completa, Compra reembolsada, Chargeback.',
      'Copie o Hottok (token de verificação) e cole no campo de segredo.',
      'Rastreio: a Hotmart devolve o parâmetro sck em data.purchase.origin.sck.']
  },
  kiwify: {
    nome: 'Kiwify', confirmado: true,
    auth: { modo: 'hmac_sha1_query', query: 'signature' },
    parametro: 'src',
    pedido: ['order_id'], produto: ['Product.product_id'],
    status: ['order_status', 'webhook_event_type'], evento: ['webhook_event_type'],
    email: ['Customer.email'], tel: ['Customer.mobile'],
    reais: [], itens: null, centavos: ['Commissions.charge_amount', 'Commissions.product_base_price'],
    teste: () => false,
    passos: ['Kiwify: Apps > Webhooks > Criar webhook.',
      'Cole a URL abaixo e escolha o produto.',
      'Marque: Compra aprovada, Reembolso, Chargeback.',
      'Copie o token do webhook e cole no campo de segredo (a Kiwify assina o corpo com ele em ?signature=).',
      'Rastreio: a Kiwify devolve src, sck e as UTMs em TrackingParameters.']
  },
  zouti: {
    nome: 'Zouti', confirmado: false,
    auth: { modo: 'token_cabecalho', cabecalho: 'x-zouti-token' },
    parametro: 'src',
    pedido: ['data.id', 'data.order_id', 'id', 'order_id'], produto: ['data.items.0.product_id', 'data.product_id', 'items.0.product_id', 'product_id'],
    status: ['data.status', 'status', 'event'], evento: ['event', 'type'],
    email: ['data.customer.email', 'customer.email'], tel: ['data.customer.phone', 'customer.phone'],
    reais: ['data.total_price_in_brl', 'data.amount_in_brl', 'total_price_in_brl', 'amount_in_brl'],
    itens: { caminhos: ['data.items', 'items'], reais: ['price_in_brl', 'total_in_brl'], qtd: 'quantity' },
    centavos: ['data.total_price', 'data.amount', 'total_price', 'amount'],
    teste: b => b && (b.test === true || b.data?.test === true),
    passos: ['Zouti: painel > Integrações > Webhooks (confirme o caminho com o suporte da Zouti).',
      'Cole a URL abaixo.',
      'Marque: pedido pago, reembolso, chargeback.',
      'Cole no campo de segredo o token que a Zouti gerou. [SEM DADO] Confirme na documentação da Zouti se ela manda token no cabeçalho, no corpo ou assinatura HMAC, e ajuste o modo abaixo.',
      'A Zouti manda valores em centavos e tem os campos *_in_brl em reais: o Bandit lê os *_in_brl primeiro.',
      'Rastreio: o quiz manda o vid em src e sck. Uma compra de teste real confirma qual dos dois volta no webhook.']
  },
  eduzz: generica('Eduzz', 'utm_content'),
  ticto: generica('Ticto', 'src'),
  greenn: generica('Greenn', 'src'),
  perfectpay: generica('Perfect Pay', 'src'),
  outra: generica('Outra', 'src')
};

function generica(nome, parametro) {
  return {
    nome, confirmado: false,
    auth: { modo: 'token_corpo', campo: 'token' },
    parametro,
    pedido: ['data.id', 'data.transaction', 'transaction', 'order_id', 'code', 'id', 'trans_cod', 'sale_code'],
    produto: ['data.product.id', 'product.id', 'product_id', 'produto_id', 'trans_items.0.product_id', 'items.0.product_id'],
    status: ['data.status', 'status', 'sale_status_enum_key', 'event', 'trans_status'], evento: ['event', 'type', 'evento'],
    email: ['data.customer.email', 'customer.email', 'buyer.email', 'cus_email', 'email'],
    tel: ['data.customer.phone', 'customer.phone', 'buyer.phone', 'cus_cel', 'phone'],
    reais: ['data.total', 'total', 'sale_amount', 'trans_value', 'amount_brl', 'value'],
    itens: { caminhos: ['data.items', 'items', 'trans_items'], reais: ['price', 'value'], qtd: 'quantity' },
    centavos: ['amount_in_cents', 'total_in_cents'],
    teste: b => b && (b.test === true || b.is_test === true),
    passos: [`${nome}: procure a tela de webhook ou postback da plataforma.`,
      'Cole a URL abaixo.',
      'Marque: compra aprovada, reembolso, chargeback.',
      `Cole no campo de segredo o token que a ${nome} gerou. [SEM DADO] Confirme na documentação oficial o modo de autenticação e a unidade do valor antes de subir.`,
      `Rastreio: o script manda o vid em ${parametro}. Uma compra de teste real confirma onde ele volta.`]
  };
}

export function authDoProjeto(db, projetoId, plataforma) {
  const base = PLATAFORMAS[plataforma]?.auth || { modo: 'token_corpo', campo: 'token' };
  const raw = leConfig(db, projetoId, 'webhook_auth:' + plataforma);
  try { return raw ? { ...base, ...JSON.parse(raw) } : base; } catch { return base; }
}

// ---------- autenticação, do jeito que a plataforma faz ----------
export function autentica(auth, segredo, { headers, raw, query, corpo }) {
  if (!segredo) return 'segredo da plataforma não configurado';
  if (auth.modo === 'token_cabecalho') {
    const v = headers[String(auth.cabecalho || '').toLowerCase()];
    return v && igualSeguro(v, segredo) ? null : 'token ausente ou inválido no cabeçalho ' + auth.cabecalho;
  }
  if (auth.modo === 'token_corpo') {
    const v = pega(corpo, auth.campo || 'token');
    return v != null && igualSeguro(String(v), segredo) ? null : 'token ausente ou inválido no campo ' + (auth.campo || 'token');
  }
  if (auth.modo === 'hmac_sha256' || auth.modo === 'hmac_sha1') {
    const alg = auth.modo === 'hmac_sha1' ? 'sha1' : 'sha256';
    let v = String(headers[String(auth.cabecalho || '').toLowerCase()] || '').replace(/^sha(1|256)=/, '');
    const esperado = crypto.createHmac(alg, segredo).update(raw).digest('hex');
    return v && igualSeguro(v.toLowerCase(), esperado) ? null : 'assinatura HMAC inválida';
  }
  if (auth.modo === 'hmac_sha1_query') {
    const v = query.get(auth.query || 'signature') || '';
    const esperado = crypto.createHmac('sha1', segredo).update(raw).digest('hex');
    return v && igualSeguro(v.toLowerCase(), esperado) ? null : 'assinatura inválida em ?' + (auth.query || 'signature');
  }
  return 'modo de autenticação desconhecido';
}

// ---------- valor em reais, na unidade documentada ----------
const num = v => (v == null || v === '' ? NaN : Number(String(v).replace(',', '.')));
export function leValor(p, corpo) {
  for (const c of p.reais) { const v = num(pega(corpo, c)); if (Number.isFinite(v)) return { valor: v, campo: c, unidade: 'reais' }; }
  if (p.itens) for (const ci of p.itens.caminhos) {
    const lista = pega(corpo, ci);
    if (!Array.isArray(lista) || !lista.length) continue;
    for (const cr of p.itens.reais) {
      if (!lista.every(i => Number.isFinite(num(i[cr])))) continue;
      const soma = lista.reduce((s, i) => s + num(i[cr]) * (Number.isFinite(num(i[p.itens.qtd])) ? num(i[p.itens.qtd]) : 1), 0);
      return { valor: Math.round(soma * 100) / 100, campo: `soma(${ci}[].${cr})`, unidade: 'reais' };
    }
  }
  for (const c of p.centavos) { const v = num(pega(corpo, c)); if (Number.isFinite(v)) return { valor: v / 100, campo: c, unidade: 'centavos' }; }
  return { valor: null, campo: null, unidade: null };
}

const primeiro = (corpo, caminhos) => {
  for (const c of caminhos) { const v = pega(corpo, c); if (v != null && v !== '') return String(v); }
  return null;
};

export function leStatus(p, corpo) {
  for (const c of p.status) {
    const v = String(pega(corpo, c) ?? '');
    if (!v) continue;
    if (CHARGEBACK.test(v)) return 'chargeback';
    if (REEMBOLSO.test(v)) return 'reembolsado';
    if (APROVADO.test(v)) return 'aprovado';
  }
  return 'pendente';
}

// ---------- atribuição em três degraus ----------
function atribui(db, projetoId, corpo, produto, emailH, telH) {
  const linksDoProduto = produto
    ? db.prepare(`SELECT l.id FROM links l JOIN produtos_do_link p ON p.link_id = l.id WHERE l.projeto_id = ? AND p.produto = ?`).all(projetoId, produto).map(r => r.id)
    : [];
  const aceita = linkId => {
    const temLista = db.prepare('SELECT COUNT(*) n FROM produtos_do_link WHERE link_id = ?').get(linkId).n > 0;
    return !temLista || linksDoProduto.includes(linkId);
  };
  let motivoProduto = null;

  // 1. o vid em qualquer campo do corpo
  const achados = new Set();
  for (const t of textos(corpo)) for (const m of t.match(UUID) || []) achados.add(m.toLowerCase());
  for (const vid of achados) {
    const v = db.prepare(`SELECT v.* FROM visitas v JOIN links l ON l.id = v.link_id WHERE v.vid = ? AND l.projeto_id = ?`).get(vid, projetoId);
    if (!v) continue;
    if (aceita(v.link_id)) return { vid, link_id: v.link_id, braco_id: v.braco_id, degrau: 'vid', teste: v.teste };
    motivoProduto = 'o vid é de outro link (produto comprado não pertence a ele)';
  }
  // 2 e 3. e-mail e telefone contra os eventos lead
  const porHash = (campo, h, degrau) => {
    if (!h) return null;
    const r = db.prepare(`SELECT e.vid, v.link_id, v.braco_id, v.teste FROM eventos e JOIN visitas v ON v.vid = e.vid
      JOIN links l ON l.id = v.link_id WHERE e.tipo = 'lead' AND e.${campo} = ? AND l.projeto_id = ?
      ORDER BY e.criado_em DESC`).all(h, projetoId).find(x => aceita(x.link_id));
    return r ? { vid: r.vid, link_id: r.link_id, braco_id: r.braco_id, degrau, teste: r.teste } : null;
  };
  const m = porHash('email_h', emailH, 'email') || porHash('tel_h', telH, 'telefone');
  if (m) return m;
  const partes = [];
  partes.push(achados.size ? 'vid não encontrado' : 'sem id de rastreio');
  if (motivoProduto) partes.push(motivoProduto);
  partes.push(emailH ? 'e-mail não encontrado' : 'sem e-mail');
  if (!emailH || telH) partes.push(telH ? 'telefone não encontrado' : 'sem telefone');
  return { vid: null, link_id: null, braco_id: null, degrau: null, motivo: partes.join(', ') };
}

// ---------- o recebimento ----------
export function recebe(db, projeto, plataforma, req) {
  const p = PLATAFORMAS[plataforma];
  const log = (o) => db.prepare(`INSERT INTO webhook_log (quando, projeto_id, plataforma, evento, status, valor, casou, degrau, erro, http, teste)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(agora(), projeto?.id ?? null, plataforma, o.evento ?? null, o.status ?? null,
    o.valor ?? null, o.casou == null ? null : (o.casou ? 1 : 0), o.degrau ?? null, o.erro ?? null, o.http, o.teste ? 1 : 0);

  if (!projeto) return { http: 404, json: { erro: 'projeto não existe' } };
  if (!p) { log({ http: 404, erro: 'plataforma desconhecida' }); return { http: 404, json: { erro: 'plataforma desconhecida' } }; }

  let corpo;
  try { corpo = JSON.parse(req.raw.toString('utf8') || '{}'); }
  catch {
    // algumas plataformas mandam form-urlencoded
    corpo = Object.fromEntries(new URLSearchParams(req.raw.toString('utf8')));
  }

  const segredo = leConfig(db, projeto.id, 'webhook_segredo:' + plataforma);
  const erroAuth = autentica(authDoProjeto(db, projeto.id, plataforma), segredo, { ...req, corpo });
  if (erroAuth) { log({ http: 401, erro: erroAuth, evento: primeiro(corpo, p.evento) }); return { http: 401, json: { erro: 'não autorizado' } }; }

  const evento = primeiro(corpo, p.evento);
  const status = leStatus(p, corpo);
  const pedido = primeiro(corpo, p.pedido);
  if (!pedido) { log({ http: 422, evento, status, erro: 'pedido sem id' }); return { http: 422, json: { erro: 'pedido sem id' } }; }
  const produto = primeiro(corpo, p.produto);
  const { valor, campo, unidade } = leValor(p, corpo);
  const emailH = hashEmail(primeiro(corpo, p.email));
  const telH = hashTel(primeiro(corpo, p.tel));
  const testePlataforma = !!p.teste(corpo) || req.teste === true;

  // idempotência: mesmo pedido + mesmo status grava uma vez
  const ja = db.prepare('SELECT id, degrau, link_id FROM vendas WHERE plataforma = ? AND pedido = ? AND status = ?').get(plataforma, pedido, status);
  if (ja) { log({ http: 200, evento, status, valor, casou: !!ja.link_id, degrau: ja.degrau, erro: 'repetido: já gravado', teste: testePlataforma }); return { http: 200, json: { ok: true, repetido: true } }; }

  // reembolso e chargeback herdam a atribuição da venda original
  let a;
  const original = status !== 'aprovado' ? db.prepare(`SELECT * FROM vendas WHERE plataforma = ? AND pedido = ? AND status = 'aprovado'`).get(plataforma, pedido) : null;
  if (original) a = { vid: original.vid, link_id: original.link_id, braco_id: original.braco_id, degrau: original.degrau, motivo: original.motivo, teste: original.teste };
  else a = atribui(db, projeto.id, corpo, produto, emailH, telH);
  const teste = testePlataforma || a.teste === 1;

  db.prepare(`INSERT INTO vendas (projeto_id, pedido, plataforma, status, valor_reais, campo_valor, unidade, produto, vid, link_id, braco_id,
    degrau, motivo, email_h, tel_h, teste, mapa_campos, criado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    projeto.id, pedido, plataforma, status, valor, campo, unidade, produto, a.vid, a.link_id, a.braco_id,
    a.degrau, a.motivo ?? null, emailH, telH, teste ? 1 : 0, JSON.stringify([...new Set(mapaCampos(corpo))]), req.quando || agora());
  log({ http: 200, evento, status, valor, casou: !!a.link_id, degrau: a.degrau, erro: a.link_id ? null : a.motivo, teste });
  return { http: 200, json: { ok: true, status, casou: !!a.link_id, degrau: a.degrau } };
}
