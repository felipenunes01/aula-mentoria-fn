// O sorteio. Thompson sampling com piso de 10% por braço ativo.
// A mesma função `sorteia` atende o link oficial (um clique) e o job que
// calcula a fatia de tráfego (10 mil cliques simulados): se fossem duas,
// a tela mostraria uma fatia que o link não pratica.
import { agora } from './db.js';

export const PISO = 0.10;
export const AMOSTRAS = 10000;
export const MINIMO = { venda: { acessos: 200, conv: 10 }, lead: { acessos: 200, conv: 30 } };

// ---------- amostradores ----------
function normal(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// Marsaglia e Tsang
function gama(k, rand) {
  if (k < 1) return gama(k + 1, rand) * Math.pow(rand(), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = normal(rand); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
export function beta(a, b, rand = Math.random) {
  const x = gama(a, rand), y = gama(b, rand);
  return x / (x + y);
}

// ---------- o sorteio de um clique ----------
// bracos: [{ id, alfa, beta, peso_fixo }] só os ATIVOS.
// modo 'auto': com probabilidade (piso × n) escolhe um braço ao acaso;
// senão, o maior sorteio de Beta. Assim cada braço tem no mínimo o piso.
export function sorteia(bracos, modo = 'auto', rand = Math.random) {
  const n = bracos.length;
  if (!n) return null;
  if (n === 1) return bracos[0];
  if (modo === 'fixo') {
    const total = bracos.reduce((s, b) => s + Math.max(0, b.peso_fixo || 0), 0);
    if (total <= 0) return bracos[Math.floor(rand() * n)];
    let r = rand() * total;
    for (const b of bracos) { r -= Math.max(0, b.peso_fixo || 0); if (r < 0) return b; }
    return bracos[n - 1];
  }
  const piso = Math.min(PISO, 1 / n);
  if (rand() < piso * n) return bracos[Math.floor(rand() * n)];
  return thompson(bracos, rand);
}

function thompson(bracos, rand) {
  let melhor = null, max = -1;
  for (const b of bracos) {
    const s = beta(b.alfa, b.beta, rand);
    if (s > max) { max = s; melhor = b; }
  }
  return melhor;
}

// ---------- o job de hora em hora ----------
// conta conversões e acessos por braço desde o início do teste
export function contagens(db, link) {
  const conv = link.objetivo === 'lead'
    ? `(SELECT COUNT(DISTINCT e.vid) FROM eventos_validos e WHERE e.braco_id = b.id AND e.tipo = 'lead')`
    : `(SELECT COUNT(*) FROM vendas_validas s WHERE s.braco_id = b.id)`;
  return db.prepare(`
    SELECT b.id, b.status, b.peso_fixo,
      (SELECT COUNT(DISTINCT e.vid) FROM eventos_validos e WHERE e.braco_id = b.id AND e.tipo = 'carregou') AS acessos,
      ${conv} AS conversoes
    FROM bracos b WHERE b.link_id = ? ORDER BY b.ordem, b.id`).all(link.id);
}

export function calculaPesos(linhas, modo, rand = Math.random) {
  const ativos = linhas.filter(l => l.status === 'ativo').map(l => ({
    id: l.id, peso_fixo: l.peso_fixo,
    alfa: 1 + l.conversoes,
    beta: 1 + Math.max(0, l.acessos - l.conversoes)
  }));
  const fatia = new Map(), chance = new Map();
  ativos.forEach(b => { fatia.set(b.id, 0); chance.set(b.id, 0); });
  if (ativos.length) {
    for (let i = 0; i < AMOSTRAS; i++) {
      const f = sorteia(ativos, modo, rand); fatia.set(f.id, fatia.get(f.id) + 1);
      const c = thompson(ativos, rand); chance.set(c.id, chance.get(c.id) + 1);
    }
  }
  return linhas.map(l => {
    const a = ativos.find(x => x.id === l.id);
    return {
      braco_id: l.id,
      alfa: a ? a.alfa : 1 + l.conversoes,
      beta: a ? a.beta : 1 + Math.max(0, l.acessos - l.conversoes),
      fatia_pct: a ? 100 * fatia.get(l.id) / AMOSTRAS : 0,
      chance_melhor_pct: a ? 100 * chance.get(l.id) / AMOSTRAS : 0
    };
  });
}

export function recalculaLink(db, link) {
  const r = calculaPesos(contagens(db, link), link.modo);
  const quando = agora();
  const grava = db.prepare(`INSERT INTO pesos (link_id, braco_id, alfa, beta, peso, fatia_pct, chance_melhor_pct, calculado_em)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(link_id, braco_id) DO UPDATE SET
    alfa=excluded.alfa, beta=excluded.beta, peso=excluded.peso, fatia_pct=excluded.fatia_pct,
    chance_melhor_pct=excluded.chance_melhor_pct, calculado_em=excluded.calculado_em`);
  for (const p of r) grava.run(link.id, p.braco_id, p.alfa, p.beta, p.fatia_pct / 100, p.fatia_pct, p.chance_melhor_pct, quando);
  return r;
}

export function recalculaTudo(db) {
  for (const l of db.prepare('SELECT * FROM links').all()) recalculaLink(db, l);
}

// "faltam 140 acessos e 7 vendas"
export function falta(objetivo, acessos, conv) {
  const m = MINIMO[objetivo] || MINIMO.venda;
  const fa = Math.max(0, m.acessos - acessos), fc = Math.max(0, m.conv - conv);
  if (!fa && !fc) return null;
  const nome = objetivo === 'lead' ? ['lead', 'leads'] : ['venda', 'vendas'];
  const partes = [];
  if (fa) partes.push(`${fa.toLocaleString('pt-BR')} ${fa === 1 ? 'acesso' : 'acessos'}`);
  if (fc) partes.push(`${fc} ${fc === 1 ? nome[0] : nome[1]}`);
  return 'faltam ' + partes.join(' e ');
}
