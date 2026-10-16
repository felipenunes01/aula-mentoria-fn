// Dados de DEMONSTRAÇÃO (simulados) para a aula. O painel mostra o selo
// "Demonstração: dados simulados" enquanto eles estiverem no banco.
// Uso: node scripts/seed.js   (apaga o banco de dados/bandit.db e recria)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abreBanco, transacao } from '../lib/db.js';
import { recalculaTudo } from '../lib/bandit.js';
import { gravaConfig, uuid, hashEmail } from '../lib/util.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQ = process.env.BANDIT_DB || path.join(DIR, 'dados', 'bandit.db');
for (const f of [ARQ, ARQ + '-wal', ARQ + '-shm']) fs.rmSync(f, { force: true });
const db = abreBanco(ARQ);
const BASE = process.env.BASE_URL || 'http://localhost:3000';

// gerador previsível: a demo sai igual toda vez
let s = 20261016; const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

const DIAS = 11;
const inicio = new Date(Date.now() - DIAS * 86400000); inicio.setUTCHours(3, 0, 0, 0);

// as 26 etapas do quiz, na ordem e com o enunciado (iguais às que o quiz manda)
const ETAPAS = [
  "Você é homem ou mulher?",
  "Qual a sua idade?",
  "Você se considera cristão(ã)?",
  "Você é casado(a)?",
  "Você tem filhos?",
  "Pra vender de novo, hoje você precisa...",
  "Quanto você investe em anúncio por mês hoje?",
  "Quando você compara o que gastou de anúncio no mês com o que entrou, o que você sente?",
  "O que você já perdeu por não saber quem era o lead antes de falar com ele?",
  "Se o seu tráfego pago parasse hoje, por quantos meses o seu faturamento se sustentaria?",
  "O que melhor descreve o seu negócio hoje?",
  "O que passa pela sua cabeça quando alguém fala em colocar um quiz na frente da oferta?",
  "Se você fosse montar um quiz hoje, o que te travaria primeiro?",
  "Na sua cabeça, pra que serve um quiz?",
  "Quanto tempo você acha que leva pra montar um quiz que converte?",
  "O que te faria acreditar que um quiz daria certo na sua operação?",
  "O que passa pela sua cabeça quando você vê um quiz de captação por aí?",
  "Você já deixou de testar um formato novo por achar que pegaria mal com a sua audiência?",
  "O que te seguraria de colocar um quiz no ar amanhã?",
  "De onde você tirou a forma como capta lead hoje?",
  "Se existisse uma forma de trazer lead qualificado que se paga sozinha, você acredita que funcionaria no seu mercado?",
  "Em quanto tempo você gostaria de saber quem, na sua lista, está pronto pra comprar?",
  "Hoje, qual é o seu maior impedimento pra isso?",
  "O quanto você quer resolver isso nos próximos 30 dias?",
  "Se você tivesse o quiz pronto, com as perguntas escritas e a página no ar, você colocaria pra rodar?",
  "Enviou o cadastro"
];

transacao(db, () => {
  db.prepare(`INSERT INTO projetos (id, slug, nome, dominio) VALUES (1, 'mentor-scale', 'Mentor Scale', '')`).run();
  db.prepare(`INSERT INTO links (id, projeto_id, slug, nome, objetivo, modo, inicio, queda_url, origens, tipo) VALUES (1, 1, 'revolucao-do-quiz', 'Quiz Revolução do Quiz', 'venda', 'auto', ?, '', ?, 'quiz')`)
    .run(inicio.toISOString(), JSON.stringify(['localhost:3000', '127.0.0.1:3000', new URL(BASE).host]));
  db.prepare(`INSERT INTO produtos_do_link VALUES (1, 'revolucao-do-quiz')`).run();
  const br = db.prepare(`INSERT INTO bracos (id, link_id, ordem, letra, nome, url, cor, muda, status) VALUES (?,?,?,?,?,?,?,?, 'ativo')`);
  br.run(1, 1, 0, 'A', 'Case', `${BASE}/q/?versao=case`, '#00DAFE', 'capa com a foto do case de R$ 22 milhões e botão');
  br.run(2, 1, 1, 'B', 'Direto', `${BASE}/q/?versao=direto`, '#A78BFA', 'headline e pergunta na mesma tela, sem foto');
  br.run(3, 1, 2, 'C', 'Case + bifurcação', `${BASE}/q/?versao=case&bif=1`, '#FF9F43', 'case com a saída para a implementação com o time');

  gravaConfig(db, 1, 'demonstracao', '1');
  gravaConfig(db, 1, 'webhook_segredo:zouti', 'demo-zouti-token');

  // perfil de cada braço: chance de seguir em cada etapa, checkout e compra
  const PERFIL = {
    1: { cliques: 2010, carrega: .85, comeca: .71, etapa: i => (i === 9 ? .78 : .985), final: .9, checkout: .16, compra: .32 },
    2: { cliques: 1968, carrega: .84, comeca: .78, etapa: i => (i === 1 ? .63 : .99), final: .92, checkout: .12, compra: .45 },
    3: { cliques: 760, carrega: .86, comeca: .70, etapa: i => (i === 25 ? .70 : .984), final: .88, checkout: .14, compra: .30 }
  };
  const vis = db.prepare('INSERT INTO visitas (vid, link_id, braco_id, criado_em, utms) VALUES (?,?,?,?,?)');
  const ev = db.prepare('INSERT OR IGNORE INTO eventos (vid, tipo, passo, nome, email_h, criado_em) VALUES (?,?,?,?,?,?)');
  const vd = db.prepare(`INSERT INTO vendas (projeto_id, pedido, plataforma, status, valor_reais, campo_valor, unidade, produto, vid, link_id, braco_id, degrau, criado_em)
    VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)`);
  let pedido = 1000;
  for (const [bid, pf] of Object.entries(PERFIL)) {
    for (let k = 0; k < pf.cliques; k++) {
      // braço C entrou no teste depois (dia 7)
      const t0 = bid === '3' ? inicio.getTime() + 7 * 86400000 : inicio.getTime();
      let t = t0 + r() * (Date.now() - t0 - 3600000);
      const iso = () => new Date(t += 20000 + r() * 40000).toISOString();
      const vid = uuid();
      vis.run(vid, 1, Number(bid), new Date(t).toISOString(), JSON.stringify({ utm_source: 'meta', utm_campaign: 'perpetuo-quiz' }));
      if (r() > pf.carrega) continue; ev.run(vid, 'carregou', 0, '', null, iso());
      if (r() > pf.comeca) continue; ev.run(vid, 'comecou', 0, '', null, iso());
      let foi = true;
      for (let i = 0; i < ETAPAS.length; i++) {
        if (r() > pf.etapa(i)) { foi = false; break; }
        const ultimo = i === ETAPAS.length - 1;
        ev.run(vid, ultimo ? 'lead' : 'etapa', ultimo ? 0 : i + 1, ultimo ? '' : ETAPAS[i], ultimo ? hashEmail(`lead${k}b${bid}@exemplo.com`) : null, iso());
        if (ultimo) ev.run(vid, 'etapa', i + 1, ETAPAS[i], null, iso());
      }
      if (!foi || r() > pf.final) continue; ev.run(vid, 'final', 0, '', null, iso());
      if (r() > pf.checkout) continue; ev.run(vid, 'checkout', 0, '', null, iso());
      if (r() > pf.compra) continue;
      const bump = r() < .3;
      vd.run('demo-' + (++pedido), 'zouti', 'aprovado', bump ? 144 : 97, bump ? 'soma(data.items[].price_in_brl)' : 'data.total_price_in_brl', 'reais', 'revolucao-do-quiz', vid, 1, Number(bid), r() < .9 ? 'vid' : 'email', iso());
    }
  }
  // um reembolso e duas vendas sem braço, para a tela mostrar os casos
  const algum = db.prepare(`SELECT * FROM vendas WHERE braco_id = 1 LIMIT 1`).get();
  vd.run(algum.pedido, 'zouti', 'reembolsado', algum.valor_reais, algum.campo_valor, 'reais', algum.produto, algum.vid, 1, 1, algum.degrau, new Date().toISOString());
  db.prepare(`INSERT INTO vendas (projeto_id, pedido, plataforma, status, valor_reais, campo_valor, unidade, produto, motivo, criado_em) VALUES (1,?, 'zouti', 'aprovado', 97, 'data.total_price_in_brl', 'reais', 'revolucao-do-quiz', ?, ?)`)
    .run('demo-sb1', 'sem id de rastreio, e-mail não encontrado', new Date(Date.now() - 2 * 86400000).toISOString());
  db.prepare(`INSERT INTO vendas (projeto_id, pedido, plataforma, status, valor_reais, campo_valor, unidade, produto, motivo, criado_em) VALUES (1,?, 'zouti', 'aprovado', 144, 'soma(data.items[].price_in_brl)', 'reais', 'revolucao-do-quiz', ?, ?)`)
    .run('demo-sb2', 'sem id de rastreio, e-mail não encontrado, telefone não encontrado', new Date(Date.now() - 5 * 3600000).toISOString());

  // investimento simulado: leitura da Meta "ok" e gasto por dia
  const g = db.prepare('INSERT INTO gasto_meta (dia, conta, anuncio, anuncio_nome, destino, link_id, valor) VALUES (?,?,?,?,?,?,?)');
  for (let d = 0; d <= DIAS; d++) {
    const dia = new Date(inicio.getTime() + d * 86400000 - 3 * 3600000).toISOString().slice(0, 10);
    g.run(dia, 'act_demo', 'ad1', 'Criativo 01: quiz', `${BASE}/l/revolucao-do-quiz`, 1, 300 + Math.round(r() * 120));
    g.run(dia, 'act_demo', 'ad9', 'Remarketing antigo', 'https://exemplo.com/pagina-antiga', null, 20 + Math.round(r() * 15));
  }
  db.prepare('INSERT INTO leituras_meta (projeto_id, quando, ok) VALUES (1, ?, 1)').run(new Date().toISOString());
});
recalculaTudo(db);
console.log('Demonstração pronta em', ARQ);
