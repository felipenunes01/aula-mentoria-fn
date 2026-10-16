// Todas as contas do painel. O navegador só formata o que sai daqui.
import { falta, MINIMO } from './bandit.js';
import { leConfig } from './util.js';

export const FUSO_OFFSET = '-03:00'; // America/Sao_Paulo (sem horário de verão desde 2019)
export const MIN_GARGALO = 20;

// dia local (YYYY-MM-DD) -> instante UTC ISO
const inicioDoDia = d => new Date(`${d}T00:00:00${FUSO_OFFSET}`).toISOString();
const fimDoDia = d => new Date(new Date(`${d}T00:00:00${FUSO_OFFSET}`).getTime() + 86400000).toISOString();
export const diaLocal = iso => new Date(new Date(iso).getTime() - 3 * 3600000).toISOString().slice(0, 10);

const taxa = (a, b) => (b > 0 ? a / b : null);

export function urlOficial(base, link) { return `${base.replace(/\/$/, '')}/l/${link.slug}`; }

export function estadoInvestimento(db, projetoId) {
  const ultima = db.prepare('SELECT * FROM leituras_meta WHERE projeto_id = ? ORDER BY id DESC LIMIT 1').get(projetoId);
  const boa = db.prepare('SELECT * FROM leituras_meta WHERE projeto_id = ? AND ok = 1 ORDER BY id DESC LIMIT 1').get(projetoId);
  return {
    lido: !!boa,
    ultima_boa: boa ? boa.quando : null,
    falhou: !!(ultima && !ultima.ok),
    erro: ultima && !ultima.ok ? ultima.erro : null,
    ultima_tentativa: ultima ? ultima.quando : null
  };
}

export function painel(db, { projetoId, linkId, bracoId, de, ate, base }) {
  const projetos = db.prepare('SELECT id, slug, nome, dominio FROM projetos ORDER BY id').all();
  const projeto = projetos.find(p => p.id === projetoId) || projetos[0];
  if (!projeto) return { vazio: 'Nenhum projeto ainda. Crie um na aba Configurações.', projetos: [] };
  const links = db.prepare('SELECT * FROM links WHERE projeto_id = ? ORDER BY id').all(projeto.id);
  const link = links.find(l => l.id === linkId) || links[0];
  const inv = estadoInvestimento(db, projeto.id);
  const baseResp = {
    projetos, projeto,
    links: links.map(l => ({ id: l.id, nome: l.nome, slug: l.slug })),
    atualizado_em: new Date().toISOString(),
    demonstracao: leConfig(db, projeto.id, 'demonstracao') === '1'
  };
  if (!link) return { ...baseResp, vazio: 'Nenhum link oficial ainda. Crie um na aba Configurações.' };

  const deDia = de || diaLocal(link.inicio);
  const ateDia = ate || diaLocal(new Date().toISOString());
  const ini = inicioDoDia(deDia) < link.inicio ? link.inicio : inicioDoDia(deDia);
  const fim = fimDoDia(ateDia);

  const bracos = db.prepare('SELECT * FROM bracos WHERE link_id = ? ORDER BY ordem, id').all(link.id);
  const pesos = new Map(db.prepare('SELECT * FROM pesos WHERE link_id = ?').all(link.id).map(p => [p.braco_id, p]));
  const produtos = db.prepare('SELECT produto FROM produtos_do_link WHERE link_id = ?').all(link.id).map(r => r.produto);

  // ---- contagens por braço no período (coorte pela data da visita) ----
  const porBraco = (sql, ...args) => new Map(db.prepare(sql).all(...args).map(r => [r.braco_id, r]));
  const cliques = porBraco(`SELECT braco_id, COUNT(*) n FROM visitas_validas WHERE link_id = ? AND criado_em >= ? AND criado_em < ? GROUP BY braco_id`, link.id, ini, fim);
  const etapaSql = `SELECT e.braco_id, e.tipo, e.passo, COUNT(DISTINCT e.vid) n FROM eventos_validos e
    JOIN visitas v ON v.vid = e.vid WHERE e.link_id = ? AND v.criado_em >= ? AND v.criado_em < ? GROUP BY e.braco_id, e.tipo, e.passo`;
  const ev = db.prepare(etapaSql).all(link.id, ini, fim);
  const conta = (b, tipo, passo = 0) => (ev.find(r => r.braco_id === b && r.tipo === tipo && r.passo === passo) || { n: 0 }).n;
  const vendas = porBraco(`SELECT braco_id, COUNT(*) n, COALESCE(SUM(valor_reais),0) receita FROM vendas_validas
    WHERE link_id = ? AND criado_em >= ? AND criado_em < ? GROUP BY braco_id`, link.id, ini, fim);

  // etapas do funil: saem dos eventos, em ordem de passo, com o enunciado mais recente
  const etapas = db.prepare(`SELECT DISTINCT passo FROM eventos_validos WHERE link_id = ? AND tipo = 'etapa' ORDER BY passo`).all(link.id);
  const nomes = new Map();
  for (const r of db.prepare(`SELECT passo, nome FROM eventos_validos WHERE link_id = ? AND tipo = 'etapa' ORDER BY criado_em`).all(link.id)) nomes.set(r.passo, r.nome);

  // ---- investimento do link (Meta, pelo destino do anúncio) ----
  const gasto = db.prepare(`SELECT COALESCE(SUM(valor),0) v FROM gasto_meta WHERE link_id = ? AND dia >= ? AND dia <= ?`).get(link.id, deDia, ateDia).v;
  const investLink = inv.lido ? gasto : null;
  const totalCliques = [...cliques.values()].reduce((s, r) => s + r.n, 0);

  // ---- amostra desde o início do teste (é ela que decide o líder) ----
  const desdeInicio = new Map(db.prepare(`SELECT b.id braco_id,
      (SELECT COUNT(DISTINCT e.vid) FROM eventos_validos e WHERE e.braco_id = b.id AND e.tipo = 'carregou') acessos,
      (SELECT COUNT(*) FROM vendas_validas s WHERE s.braco_id = b.id) vendas,
      (SELECT COUNT(DISTINCT e.vid) FROM eventos_validos e WHERE e.braco_id = b.id AND e.tipo = 'lead') leads
    FROM bracos b WHERE b.link_id = ?`).all(link.id).map(r => [r.braco_id, r]));
  const ativos = bracos.filter(b => b.status === 'ativo');
  const conv = r => (link.objetivo === 'lead' ? r.leads : r.vendas);
  const comAmostra = b => { const r = desdeInicio.get(b.id); return !falta(link.objetivo, r.acessos, conv(r)); };
  const todosComAmostra = ativos.length > 1 && ativos.every(comAmostra);
  let liderId = null;
  if (todosComAmostra) liderId = ativos.reduce((m, b) => ((pesos.get(b.id)?.chance_melhor_pct ?? -1) > (pesos.get(m.id)?.chance_melhor_pct ?? -1) ? b : m), ativos[0]).id;

  const linhas = bracos.map(b => {
    const cl = cliques.get(b.id)?.n || 0;
    const acessos = conta(b.id, 'carregou');
    const comecou = conta(b.id, 'comecou');
    const final = conta(b.id, 'final');
    const checkout = conta(b.id, 'checkout');
    const leads = conta(b.id, 'lead');
    const vd = vendas.get(b.id)?.n || 0;
    const receita = vendas.get(b.id)?.receita || 0;
    const invest = investLink == null ? null : (totalCliques > 0 ? investLink * cl / totalCliques : 0);
    const p = pesos.get(b.id);
    const amostra = desdeInicio.get(b.id);
    const faltaTxt = b.status === 'ativo' ? falta(link.objetivo, amostra.acessos, conv(amostra)) : null;

    // funil, etapa por etapa
    const passos = [
      { chave: 'clicou', nome: 'Clicou', n: cl },
      { chave: 'carregou', nome: 'Carregou', n: acessos },
      { chave: 'comecou', nome: 'Começou', n: comecou },
      ...etapas.map(e => ({ chave: 'etapa:' + e.passo, nome: nomes.get(e.passo) || ('Etapa ' + e.passo), passo: e.passo, n: conta(b.id, 'etapa', e.passo) })),
      { chave: 'final', nome: 'Final', n: final },
      { chave: 'checkout', nome: 'Checkout', n: checkout, oferta: true },
      { chave: 'comprou', nome: 'Comprou', n: vd, oferta: true }
    ];
    let gargalo = null, maior = 0;
    passos.forEach((s, i) => {
      s.barra_pct = cl > 0 ? 100 * s.n / cl : null;
      const prox = passos[i + 1];
      s.seguiu_pct = prox && s.n > 0 ? 100 * prox.n / s.n : null;
      s.perdeu = prox ? Math.max(0, s.n - prox.n) : null;
      s.perdeu_pct = prox && s.n > 0 ? 100 * (s.n - prox.n) / s.n : null;
      if (i === 0 || s.oferta) return;
      const ant = passos[i - 1];
      s.queda_pct = ant.n > 0 ? 100 * (ant.n - s.n) / ant.n : null;
      if (ant.n >= MIN_GARGALO && s.queda_pct > maior) { maior = s.queda_pct; gargalo = i; }
    });
    if (gargalo != null && maior > 0) passos[gargalo].gargalo = true;

    return {
      id: b.id, letra: b.letra, nome: b.nome, cor: b.cor, muda: b.muda, url: b.url, status: b.status,
      fatia_pct: b.status === 'ativo' && p ? p.fatia_pct : null,
      chance_melhor_pct: b.status === 'ativo' && p && !faltaTxt ? p.chance_melhor_pct : null,
      falta: faltaTxt,
      lider: b.id === liderId,
      cliques: cl, acessos, comecou, final, checkout, leads, vendas: vd, retorno: receita,
      interacao_pct: pct(taxa(comecou, acessos)),
      conclusao_pct: pct(taxa(final, acessos)),
      conv_quiz_pct: pct(taxa(vd, acessos)),
      conv_checkout_pct: pct(taxa(vd, checkout)),
      passagem_checkout_pct: pct(taxa(checkout, acessos)),
      investimento: invest,
      roas: invest > 0 ? receita / invest : null,
      cpa: invest == null ? null : (vd > 0 ? invest / vd : null),
      ticket: vd > 0 ? receita / vd : null,
      funil: passos,
      frase: `${fmtN(final)} de ${fmtN(acessos)} chegaram ao final, ${fmtN(checkout)} ${checkout === 1 ? 'foi' : 'foram'} ao checkout, ${fmtN(vd)} ${vd === 1 ? 'comprou' : 'compraram'}`
    };
  });

  const soma = k => linhas.reduce((s, l) => s + (l[k] || 0), 0);
  const tot = { cliques: soma('cliques'), acessos: soma('acessos'), comecou: soma('comecou'), final: soma('final'), checkout: soma('checkout'), vendas: soma('vendas'), retorno: soma('retorno'), leads: soma('leads') };
  const total = {
    ...tot,
    interacao_pct: pct(taxa(tot.comecou, tot.acessos)),
    conv_quiz_pct: pct(taxa(tot.vendas, tot.acessos)),
    conv_checkout_pct: pct(taxa(tot.vendas, tot.checkout)),
    investimento: investLink,
    roas: investLink > 0 ? tot.retorno / investLink : null,
    cpa: investLink == null ? null : (tot.vendas > 0 ? investLink / tot.vendas : null)
  };

  // resumo: do braço filtrado ou do link inteiro
  const foco = bracoId ? linhas.find(l => l.id === bracoId) : null;
  const r = foco || total;
  const resumo = {
    investimento: r.investimento, retorno: r.retorno, roas: r.roas, vendas: r.vendas,
    conv_quiz_pct: r.conv_quiz_pct, conv_checkout_pct: r.conv_checkout_pct,
    base: { acessos: r.acessos, checkout: r.checkout, vendas: r.vendas, investimento_estimado: !!foco }
  };

  // vendas sem braço do projeto, no período
  const semBraco = db.prepare(`SELECT criado_em, valor_reais, produto, motivo, plataforma, pedido FROM vendas
    WHERE projeto_id = ? AND link_id IS NULL AND status = 'aprovado' AND teste = 0 AND criado_em >= ? AND criado_em < ?
    AND NOT EXISTS (SELECT 1 FROM vendas r WHERE r.plataforma = vendas.plataforma AND r.pedido = vendas.pedido AND r.status IN ('reembolsado','chargeback'))
    ORDER BY criado_em DESC`).all(projeto.id, inicioDoDia(deDia), fim);
  const foraDosTestes = inv.lido ? db.prepare(`SELECT destino, anuncio_nome, COALESCE(SUM(valor),0) valor FROM gasto_meta
    WHERE link_id IS NULL AND dia >= ? AND dia <= ? GROUP BY destino, anuncio_nome ORDER BY valor DESC`).all(deDia, ateDia) : [];

  const status = link.status === 'pausado' ? 'pausado' : (ativos.length ? 'no_ar' : 'sem_braco');
  return {
    ...baseResp,
    filtros: { projeto: projeto.id, link: link.id, braco: bracoId || null, de: deDia, ate: ateDia },
    link: {
      id: link.id, nome: link.nome, slug: link.slug, url: urlOficial(base, link), status,
      objetivo: link.objetivo, modo: link.modo, inicio: link.inicio, tipo: link.tipo,
      nota_objetivo: link.objetivo === 'lead' && produtos.length ? 'Objetivo provisório até as primeiras vendas' : null,
      produtos
    },
    investimento: inv,
    resumo,
    bracos: linhas,
    total,
    aviso_sem_venda: link.objetivo === 'venda' && [...desdeInicio.values()].every(x => x.vendas === 0) && tot.cliques > 0
      ? 'Nenhuma venda ainda: o sorteio divide igual até as primeiras vendas.' : null,
    minimo: MINIMO[link.objetivo],
    sem_braco: semBraco,
    fora_dos_testes: foraDosTestes,
    pesos_calculados_em: [...pesos.values()][0]?.calculado_em || null
  };
}

function pct(x) { return x == null ? null : 100 * x; }
function fmtN(n) { return Number(n).toLocaleString('pt-BR'); }

// ---------- CSV (BOM UTF-8, separador ;) ----------
export function csv(dados) {
  const brl = v => (v == null ? '' : v.toFixed(2).replace('.', ','));
  const p = v => (v == null ? '' : v.toFixed(1).replace('.', ','));
  const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const linhas = [];
  linhas.push(['Braço', 'Status', 'Fatia do tráfego %', 'Chance de ser o melhor %', 'Cliques', 'Acessos', 'Interação %', 'Checkout', 'Vendas',
    'Conv. quiz %', 'Conv. checkout %', 'Investimento (estimativa)', 'Retorno', 'ROAS', 'CPA'].map(q).join(';'));
  for (const b of dados.bracos) linhas.push([b.letra + ' ' + b.nome, b.status, p(b.fatia_pct), p(b.chance_melhor_pct), b.cliques, b.acessos,
    p(b.interacao_pct), b.checkout, b.vendas, p(b.conv_quiz_pct), p(b.conv_checkout_pct), brl(b.investimento), brl(b.retorno),
    b.roas == null ? '' : b.roas.toFixed(2).replace('.', ','), brl(b.cpa)].map(q).join(';'));
  linhas.push('');
  linhas.push(['Funil', 'Braço', 'Etapa', 'Chegaram', '% do clique', '% que seguiu', 'Perderam', 'Gargalo'].map(q).join(';'));
  for (const b of dados.bracos) b.funil.forEach((s, i) => linhas.push([i + 1, b.letra + ' ' + b.nome, s.nome, s.n, p(s.barra_pct), p(s.seguiu_pct), s.perdeu ?? '', s.gargalo ? 'sim' : ''].map(q).join(';')));
  return '﻿' + linhas.join('\r\n');
}
