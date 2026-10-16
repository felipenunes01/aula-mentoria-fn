// Investimento: leitura da API de Marketing da Meta, SÓ LEITURA (ads_read).
// O token nunca sai do servidor: não vai para o navegador nem para o log.
import { agora, transacao } from './db.js';
import { leConfig, gravaConfig } from './util.js';
import { diaLocal, urlOficial } from './metricas.js';

const API = 'https://graph.facebook.com/v21.0';

export function tokenDoProjeto(db, projetoId) {
  return leConfig(db, projetoId, 'meta_token') || process.env.META_TOKEN || null;
}

async function get(caminho, params, token) {
  const u = new URL(API + caminho);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
  u.searchParams.set('access_token', token);
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => ({}));
  // a mensagem de erro da Meta não leva o token, mas a URL leva: nunca logar a URL
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}
async function todas(caminho, params, token) {
  let j = await get(caminho, params, token), out = [...(j.data || [])];
  while (j.paging?.next) {
    const r = await fetch(j.paging.next, { signal: AbortSignal.timeout(20000) });
    j = await r.json();
    if (j.error) throw new Error(j.error.message);
    out = out.concat(j.data || []);
  }
  return out;
}

// depois de colar o token: as contas que ele enxerga e o gasto de 7 dias de cada uma
export async function listaContas(token) {
  const contas = await todas('/me/adaccounts', { fields: 'id,name,account_status,currency,insights.date_preset(last_7d){spend}', limit: 100 }, token);
  return contas.map(c => ({ id: c.id, nome: c.name, moeda: c.currency, ativa: c.account_status === 1, gasto_7d: Number(c.insights?.data?.[0]?.spend || 0) }));
}

export async function vencimento(token) {
  const j = await get('/debug_token', { input_token: token }, token);
  const exp = j.data?.expires_at;
  return { expira_em: exp ? new Date(exp * 1000).toISOString() : null, nunca_vence: exp === 0, tipo: j.data?.type || null, escopos: j.data?.scopes || [] };
}

const chaveUrl = u => {
  try { const x = new URL(u); return (x.host.toLowerCase() + x.pathname.replace(/\/+$/, '')); } catch { return null; }
};
const URLS = /https?:\/\/[^\s"'<>]+/g;

export async function lerMeta(db, projeto, base) {
  const token = tokenDoProjeto(db, projeto.id);
  const contas = JSON.parse(leConfig(db, projeto.id, 'meta_contas') || '[]');
  const registra = (ok, erro) => db.prepare('INSERT INTO leituras_meta (projeto_id, quando, ok, erro) VALUES (?,?,?,?)').run(projeto.id, agora(), ok ? 1 : 0, erro || null);
  if (!token) { registra(false, 'token da Meta não configurado'); return { ok: false, erro: 'token da Meta não configurado' }; }
  if (!contas.length) { registra(false, 'nenhuma conta de anúncio escolhida'); return { ok: false, erro: 'nenhuma conta de anúncio escolhida' }; }

  const links = db.prepare('SELECT * FROM links WHERE projeto_id = ?').all(projeto.id);
  const baseOficial = projeto.dominio ? 'https://' + projeto.dominio.replace(/^https?:\/\//, '') : base;
  const mapa = new Map(links.map(l => [chaveUrl(urlOficial(baseOficial, l)), l.id]));
  const desde = diaLocal(links.reduce((m, l) => (l.inicio < m ? l.inicio : m), new Date().toISOString()));
  const ate = diaLocal(new Date().toISOString());

  const linhas = [];
  try {
    // uma conta que falha derruba a leitura inteira: somar só as que responderam
    // mostraria gasto menor com cara de certo
    for (const conta of contas) {
      const ads = await todas(`/${conta}/ads`, { fields: 'id,name,creative{object_story_spec,asset_feed_spec,link_url,template_url}', limit: 200 }, token);
      const destino = new Map();
      for (const a of ads) {
        const urls = JSON.stringify(a.creative || {}).match(URLS) || [];
        const casada = urls.find(u => mapa.has(chaveUrl(u)));
        destino.set(a.id, { url: casada || urls[0] || '', link_id: casada ? mapa.get(chaveUrl(casada)) : null, nome: a.name });
      }
      const ins = await todas(`/${conta}/insights`, { level: 'ad', fields: 'ad_id,ad_name,spend', time_increment: 1, time_range: { since: desde, until: ate }, limit: 500 }, token);
      for (const i of ins) {
        const d = destino.get(i.ad_id) || { url: '', link_id: null, nome: i.ad_name };
        linhas.push({ dia: i.date_start, conta, anuncio: i.ad_id, nome: i.ad_name || d.nome, destino: d.url, link_id: d.link_id, valor: Number(i.spend || 0) });
      }
    }
  } catch (e) {
    registra(false, e.message);
    return { ok: false, erro: e.message };
  }
  transacao(db, () => {
    const del = db.prepare('DELETE FROM gasto_meta WHERE conta = ? AND dia >= ? AND dia <= ?');
    for (const c of contas) del.run(c, desde, ate);
    const ins = db.prepare('INSERT OR REPLACE INTO gasto_meta (dia, conta, anuncio, anuncio_nome, destino, link_id, valor) VALUES (?,?,?,?,?,?,?)');
    for (const l of linhas) ins.run(l.dia, l.conta, l.anuncio, l.nome, l.destino, l.link_id, l.valor);
  });
  registra(true, null);
  try { const v = await vencimento(token); gravaConfig(db, projeto.id, 'meta_vencimento', JSON.stringify(v)); } catch {}
  return { ok: true, linhas: linhas.length };
}
