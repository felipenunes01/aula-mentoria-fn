// Bandit: link oficial, rastreio, webhook de venda e painel. Node 22, sem dependências.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abreBanco, agora } from './lib/db.js';
import { sorteia, recalculaLink, recalculaTudo } from './lib/bandit.js';
import { painel, csv } from './lib/metricas.js';
import { recebe, PLATAFORMAS } from './lib/webhook.js';
import { lerMeta, tokenDoProjeto } from './lib/meta.js';
import { ehRobo, uuid, igualSeguro, gravaConfig, leConfig } from './lib/util.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
try { for (const l of fs.readFileSync(path.join(DIR, '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; } } catch {}

const PORTA = Number(process.env.PORT || 3000);
const SENHA = process.env.BANDIT_SENHA || 'aula';
export const db = abreBanco(process.env.BANDIT_DB || path.join(DIR, 'dados', 'bandit.db'));

// ---------- cache do sorteio: o link nunca espera o banco para decidir ----------
const cache = new Map();
export function recarregaCache() {
  cache.clear();
  for (const l of db.prepare('SELECT * FROM links').all()) {
    const bracos = db.prepare(`SELECT b.*, COALESCE(p.alfa,1) alfa, COALESCE(p.beta,1) beta FROM bracos b
      LEFT JOIN pesos p ON p.braco_id = b.id WHERE b.link_id = ? ORDER BY b.ordem, b.id`).all(l.id);
    cache.set(l.slug, { link: l, controle: bracos[0] || null, ativos: l.status === 'ativo' ? bracos.filter(b => b.status === 'ativo') : [] });
  }
}
recarregaCache();

const base = req => process.env.BASE_URL || `http://${req.headers.host}`;
const ROBO_PARAMS = ['vid', 'link', 'braco'];
function destino(url, params, extra) {
  const u = new URL(url);
  for (const [k, v] of params) if (!ROBO_PARAMS.includes(k)) u.searchParams.set(k, v);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.toString();
}

// ---------- GET/HEAD /l/<slug> ----------
function linkOficial(req, res, slug, q) {
  const c = cache.get(slug);
  const vai = (url) => { res.writeHead(302, { Location: url, 'Cache-Control': 'no-store' }); res.end(); };
  if (!c) { res.writeHead(404); return res.end('link não encontrado'); }
  const queda = c.link.queda_url || base(req) + '/queda';
  if (ehRobo(req.headers['user-agent']) && c.controle) return vai(destino(c.controle.url, q, {}));
  const braco = sorteia(c.ativos, c.link.modo);
  if (!braco) return vai(queda);
  if (req.method === 'HEAD') return vai(destino(braco.url, q, { link: c.link.slug, braco: braco.letra }));
  const vid = uuid();
  try {
    const utms = Object.fromEntries([...q].filter(([k]) => /^utm_|^fbclid$/.test(k)));
    db.prepare('INSERT INTO visitas (vid, link_id, braco_id, criado_em, utms, teste) VALUES (?,?,?,?,?,?)')
      .run(vid, c.link.id, braco.id, agora(), JSON.stringify(utms), q.get('revisao') === '1' ? 1 : 0);
  } catch { return vai(queda); } // banco fora do ar: clique pago não termina em erro
  vai(destino(braco.url, q, { vid, link: c.link.slug, braco: braco.letra }));
}

// ---------- POST /api/evento ----------
const TIPOS = new Set(['carregou', 'comecou', 'etapa', 'final', 'lead', 'checkout']);
function evento(req, res, raw) {
  const origem = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '');
  let e; try { e = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { erro: 'json inválido' }); }
  const v = e.vid && db.prepare('SELECT v.*, l.origens FROM visitas v JOIN links l ON l.id = v.link_id WHERE v.vid = ?').get(String(e.vid));
  if (!v) return json(res, 202, { ok: true, conta: false }); // sem vid: não conta para nenhum braço
  const permitidas = JSON.parse(v.origens || '[]');
  let host = ''; try { host = new URL(origem).host; } catch {}
  if (!host || !(permitidas.includes(host) || permitidas.includes(origem))) return json(res, 403, { erro: 'origem não permitida' });
  res.setHeader('Access-Control-Allow-Origin', origem);
  if (!TIPOS.has(e.tipo)) return json(res, 400, { erro: 'tipo inválido' });
  const passo = e.tipo === 'etapa' ? Math.max(0, Number(e.passo) || 0) : 0;
  db.prepare(`INSERT OR IGNORE INTO eventos (vid, tipo, passo, nome, email_h, tel_h, criado_em, teste) VALUES (?,?,?,?,?,?,?,?)`)
    .run(v.vid, e.tipo, passo, String(e.nome || '').slice(0, 140), e.email_h || null, e.tel_h || null, agora(), (e.teste || v.teste) ? 1 : 0);
  json(res, 204);
}

// ---------- login ----------
const COOKIE = 'bandit_s';
function logado(req) {
  const m = (req.headers.cookie || '').match(/bandit_s=([a-f0-9-]+)/);
  return !!(m && db.prepare('SELECT 1 FROM sessoes WHERE token = ?').get(m[1]));
}

function json(res, code, obj) {
  if (code === 204) { res.writeHead(204); return res.end(); }
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
function arquivo(res, f) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('não encontrado'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}
const corpo = req => new Promise(ok => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });

let ultimoRecalculo = 0;

export const servidor = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    let m;
    if ((m = p.match(/^\/l\/([\w-]+)\/?$/)) && (req.method === 'GET' || req.method === 'HEAD')) return linkOficial(req, res, m[1], u.searchParams);

    if (p === '/api/evento') {
      if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': req.headers.origin || '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST' }); return res.end(); }
      if (req.method === 'POST') return evento(req, res, await corpo(req));
    }
    if ((m = p.match(/^\/api\/webhook\/([\w-]+)\/([\w-]+)$/)) && req.method === 'POST') {
      const raw = await corpo(req);
      const projeto = db.prepare('SELECT * FROM projetos WHERE slug = ?').get(m[1]);
      const r = recebe(db, projeto, m[2], { headers: req.headers, raw, query: u.searchParams });
      if (r.http === 200 && !r.json.repetido) recarregaCache();
      return json(res, r.http, r.json);
    }
    if (p === '/api/login' && req.method === 'POST') {
      const b = new URLSearchParams((await corpo(req)).toString());
      if (!igualSeguro(b.get('senha') || '', SENHA)) { res.writeHead(302, { Location: '/login?erro=1' }); return res.end(); }
      const t = uuid(); db.prepare('INSERT INTO sessoes (token, criado_em) VALUES (?,?)').run(t, agora());
      res.writeHead(302, { Location: '/painel', 'Set-Cookie': `${COOKIE}=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000` });
      return res.end();
    }
    if (p === '/bandit.js') return arquivo(res, path.join(DIR, 'public', 'rastreio.js'));
    if (p === '/login') return arquivo(res, path.join(DIR, 'public', 'login.html'));
    if (p === '/queda') return arquivo(res, path.join(DIR, 'public', 'queda.html'));
    if (p === '/checkout-demo') return arquivo(res, path.join(DIR, 'public', 'checkout-demo.html'));
    if (p === '/api/demo/comprar' && req.method === 'POST') return comprarDemo(req, res, JSON.parse((await corpo(req)).toString() || '{}'));
    if (p === '/q' ) { res.writeHead(302, { Location: '/q/' + u.search }); return res.end(); }
    if (p === '/q/') return arquivo(res, path.join(DIR, 'quiz', 'index.html'));
    if ((m = p.match(/^\/(?:q\/)?img\/([\w.-]+)$/))) return arquivo(res, path.join(DIR, 'quiz', 'img', m[1]));

    // ---------- daqui para baixo, só com login ----------
    if (p === '/' || p === '/painel') {
      if (!logado(req)) { res.writeHead(302, { Location: '/login' }); return res.end(); }
      return arquivo(res, path.join(DIR, 'public', 'painel.html'));
    }
    if (p.startsWith('/api/')) {
      if (!logado(req)) return json(res, 401, { erro: 'login necessário' });
      const n = k => (u.searchParams.get(k) ? Number(u.searchParams.get(k)) : null);
      const filtros = { projetoId: n('projeto'), linkId: n('link'), bracoId: n('braco'), de: u.searchParams.get('de'), ate: u.searchParams.get('ate'), base: base(req) };
      if (p === '/api/painel') return json(res, 200, painel(db, filtros));
      if (p === '/api/exportar') {
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bandit.csv"' });
        return res.end(csv(painel(db, filtros)));
      }
      if (p === '/api/braco' && req.method === 'POST') {
        const b = JSON.parse((await corpo(req)).toString());
        // grava sempre, sem ler o estado antes: cache velho faria o pedido não gravar
        db.prepare('UPDATE bracos SET status = ? WHERE id = ?').run(b.acao === 'pausar' ? 'pausado' : 'ativo', b.id);
        const l = db.prepare('SELECT l.* FROM links l JOIN bracos b ON b.link_id = l.id WHERE b.id = ?').get(b.id);
        if (l) recalculaLink(db, l);
        recarregaCache();
        return json(res, 200, { ok: true });
      }
      if (p === '/api/recalcular' && req.method === 'POST') {
        if (Date.now() - ultimoRecalculo < 60000) return json(res, 429, { erro: 'Recalculado há menos de 1 minuto. Tente de novo em instantes.' });
        ultimoRecalculo = Date.now(); recalculaTudo(db); recarregaCache();
        return json(res, 200, { ok: true });
      }
      if (p === '/api/config') {
        const projetos = db.prepare('SELECT * FROM projetos').all().map(pr => ({
          ...pr,
          links: db.prepare('SELECT * FROM links WHERE projeto_id = ?').all(pr.id).map(l => ({
            ...l, bracos: db.prepare('SELECT * FROM bracos WHERE link_id = ? ORDER BY ordem').all(l.id),
            produtos: db.prepare('SELECT produto FROM produtos_do_link WHERE link_id = ?').all(l.id).map(r => r.produto)
          })),
          webhook_url: `${base(req)}/api/webhook/${pr.slug}/`,
          log: db.prepare('SELECT * FROM webhook_log WHERE projeto_id = ? ORDER BY id DESC LIMIT 20').all(pr.id),
          meta_token: !!tokenDoProjeto(db, pr.id)
        }));
        return json(res, 200, { projetos, plataformas: Object.fromEntries(Object.entries(PLATAFORMAS).map(([k, v]) => [k, { nome: v.nome, confirmado: v.confirmado, parametro: v.parametro, passos: v.passos, auth: v.auth }])), base: base(req) });
      }
    }
    res.writeHead(404); res.end('não encontrado');
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'erro interno' });
  }
});

// checkout de demonstração: monta o pedido como a Zouti e manda para o próprio webhook, autenticado
async function comprarDemo(req, res, b) {
  const projeto = db.prepare('SELECT * FROM projetos ORDER BY id LIMIT 1').get();
  const segredo = leConfig(db, projeto.id, 'webhook_segredo:zouti');
  const itens = [{ product_id: 'revolucao-do-quiz', name: 'A Revolução do Quiz', price_in_brl: 97, quantity: 1 }];
  if (b.bump) itens.push({ product_id: 'bump-prompts', name: 'Pacote de prompts', price_in_brl: 47, quantity: 1 });
  const total = itens.reduce((s, i) => s + i.price_in_brl, 0);
  const pedido = { event: 'order.paid', data: { id: 'demo-' + Date.now(), status: 'paid', total_price: total * 100, total_price_in_brl: total,
    items: itens, customer: { email: b.email || '', phone: b.phone || '' }, tracking: { src: b.src || '', sck: b.sck || '' } } };
  const r = await fetch(`http://127.0.0.1:${PORTA}/api/webhook/${projeto.slug}/zouti`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-zouti-token': segredo || '' }, body: JSON.stringify(pedido) });
  json(res, r.status, await r.json());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  servidor.listen(PORTA, () => {
    console.log(`Bandit no ar: http://localhost:${PORTA}/painel  (senha: ${SENHA === 'aula' ? 'aula' : 'a do .env'})`);
    console.log(`Link oficial de exemplo: http://localhost:${PORTA}/l/revolucao-do-quiz`);
  });
  // job de hora em hora: pesos do sorteio e investimento da Meta
  const hora = async () => {
    recalculaTudo(db); recarregaCache();
    for (const pr of db.prepare('SELECT * FROM projetos').all()) if (tokenDoProjeto(db, pr.id)) await lerMeta(db, pr, process.env.BASE_URL || `http://localhost:${PORTA}`).catch(() => {});
  };
  setInterval(hora, 3600000);
}
