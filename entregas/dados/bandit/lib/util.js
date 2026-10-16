import crypto from 'node:crypto';

export const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');

// mesma normalização do script de rastreio (public/rastreio.js)
export function normalizaEmail(e) { return String(e || '').trim().toLowerCase().replace(/\s+/g, ''); }
export function normalizaTel(t) {
  let d = String(t || '').replace(/\D+/g, '');
  if (!d) return '';
  if (d.length <= 11) d = '55' + d; // sem DDI: Brasil
  return d;
}
export const hashEmail = e => { const n = normalizaEmail(e); return n ? sha256(n) : null; };
export const hashTel = t => { const n = normalizaTel(t); return n ? sha256(n) : null; };

// ---------- cofre: segredo do webhook e token da Meta, cifrados ----------
function chave() {
  const k = process.env.BANDIT_CHAVE || 'troque-esta-chave-no-env';
  return crypto.createHash('sha256').update(k).digest();
}
export function cifra(txt) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', chave(), iv);
  const enc = Buffer.concat([c.update(String(txt), 'utf8'), c.final()]);
  return 'v1:' + Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}
export function decifra(v) {
  if (!v || !v.startsWith('v1:')) return null;
  try {
    const b = Buffer.from(v.slice(3), 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', chave(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch { return null; }
}
export const final4 = s => (s ? '••••' + String(s).slice(-4) : '');

export function igualSeguro(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ---------- config por projeto ----------
const SENSIVEIS = new Set(['webhook_segredo', 'meta_token']);
export function leConfig(db, projetoId, chaveCfg, padrao = null) {
  const r = db.prepare('SELECT valor FROM config WHERE projeto_id = ? AND chave = ?').get(projetoId, chaveCfg);
  if (!r) return padrao;
  return SENSIVEIS.has(chaveCfg.split(':')[0]) ? decifra(r.valor) : r.valor;
}
export function gravaConfig(db, projetoId, chaveCfg, valor) {
  const v = SENSIVEIS.has(chaveCfg.split(':')[0]) ? cifra(valor) : String(valor);
  db.prepare(`INSERT INTO config (projeto_id, chave, valor) VALUES (?,?,?)
    ON CONFLICT(projeto_id, chave) DO UPDATE SET valor = excluded.valor`).run(projetoId, chaveCfg, v);
}

// ---------- robôs: validador de anúncio, crawler, antivírus de e-mail ----------
const ROBO = /bot|crawl|spider|slurp|facebookexternalhit|facebot|meta-externalagent|whatsapp|telegrambot|preview|curl\/|wget|python-requests|headless|lighthouse|pingdom|monitor|scanner|proofpoint|mimecast|barracuda|safelinks/i;
export const ehRobo = ua => !ua || ROBO.test(ua);

export function uuid() { return crypto.randomUUID(); }

// achata um objeto em nomes de campos: { a:{ b:1 } } -> ['a.b']
export function mapaCampos(obj, prefixo = '', out = []) {
  if (Array.isArray(obj)) { if (obj.length) mapaCampos(obj[0], prefixo + '[]', out); else out.push(prefixo + '[]'); return out; }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) mapaCampos(obj[k], prefixo ? prefixo + '.' + k : k, out);
    return out;
  }
  out.push(prefixo);
  return out;
}

// lê caminho "data.customer.email"
export function pega(obj, caminho) {
  return caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// todos os textos do corpo, em qualquer profundidade (para achar o vid)
export function textos(obj, out = []) {
  if (obj == null) return out;
  if (typeof obj === 'string') out.push(obj);
  else if (typeof obj === 'object') for (const k in obj) textos(obj[k], out);
  return out;
}
