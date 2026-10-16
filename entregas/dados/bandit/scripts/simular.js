// Simulação do checklist: braço A converte 4%, B converte 2%.
// Depois de 2.000 cliques, A deve receber mais de 70% do tráfego e B nunca menos de 10%.
// Usa as MESMAS funções do link oficial (sorteia e calculaPesos), recalculando a cada 100 cliques (o "job").
import { sorteia, calculaPesos } from '../lib/bandit.js';
const real = { A: 0.04, B: 0.02 };
const bracos = [{ id: 'A', status: 'ativo', acessos: 0, conversoes: 0 }, { id: 'B', status: 'ativo', acessos: 0, conversoes: 0 }];
let pesos = bracos.map(b => ({ id: b.id, alfa: 1, beta: 1 })), menorB = 100, ultimos = { A: 0, B: 0 };
for (let c = 1; c <= 2000; c++) {
  const escolhido = sorteia(pesos, 'auto').id;
  const b = bracos.find(x => x.id === escolhido);
  b.acessos++; if (Math.random() < real[b.id]) b.conversoes++;
  if (c > 1500) ultimos[b.id]++;
  if (c % 100 === 0) {
    const r = calculaPesos(bracos, 'auto');
    pesos = r.map(p => ({ id: p.braco_id, alfa: p.alfa, beta: p.beta }));
    const fB = r.find(p => p.braco_id === 'B').fatia_pct; menorB = Math.min(menorB, fB);
    if (c % 500 === 0) console.log(`${c} cliques: fatia A ${r[0].fatia_pct.toFixed(1)}%, B ${fB.toFixed(1)}% · chance de A ser o melhor ${r[0].chance_melhor_pct.toFixed(1)}% · vendas A ${bracos[0].conversoes}, B ${bracos[1].conversoes}`);
  }
}
const fatiaA = calculaPesos(bracos, 'auto')[0].fatia_pct;
console.log(`\nFinal: A recebe ${fatiaA.toFixed(1)}% ${fatiaA > 70 ? 'OK (> 70%)' : 'ABAIXO de 70% nesta rodada'} · menor fatia de B: ${menorB.toFixed(1)}% ${menorB >= 9.5 ? 'OK (piso de 10%)' : 'ABAIXO DO PISO'}`);
