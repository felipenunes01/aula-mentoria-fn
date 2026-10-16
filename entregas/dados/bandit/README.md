# Bandit: otimizador de quiz com painel de conversão

Réplica do quiz **A Revolução do Quiz** (case.mentorscale.com.br), com as 4 imagens e os 4 vídeos, ligada a um **Bandit** (Thompson sampling) que divide o tráfego entre as versões e mostra qual vende mais. Feito para a aula da mentoria.

## Rodar em 1 minuto (Node 22.5 ou mais novo, sem instalar nada)

```bash
cd entregas/dados/bandit
npm run seed      # cria o banco com DADOS DE DEMONSTRAÇÃO (simulados)
npm start         # http://localhost:3000/painel  (senha: aula)
```

| O que | Endereço |
| --- | --- |
| Painel (Painel + Configurações) | http://localhost:3000/painel |
| **Link oficial** (vai no anúncio) | http://localhost:3000/l/revolucao-do-quiz |
| Quiz direto (sem contar) | http://localhost:3000/q/?versao=case&revisao=1 |
| Checkout de demonstração | aparece no fim do quiz, ao clicar em comprar |

## Roteiro da aula (10 min)
1. **Painel**: os 3 braços (A Case, B Direto, C Case + bifurcação), fatia do tráfego, chance de ser o melhor e o "faltam 3 vendas" do C. Ninguém é líder antes da amostra mínima.
2. **Funil**: a maior queda em vermelho. No A é o "Começou", no B é "Qual a sua idade?" (▼ -37%).
3. **Link oficial**: abra em aba anônima. Ele sorteia um braço e manda para o quiz com `vid`, `link`, `braco` e as UTMs.
4. **Responda o quiz até o fim** e compre no checkout de demonstração (marque o order bump). Clique em Atualizar: a venda entra no braço certo, R$ 144 pela soma dos itens, vinda do webhook e não do pixel.
5. **Pausar** um braço: o próximo clique não cai nele. **Ativar** devolve.
6. Terminal: `npm run simular` mostra A (4%) contra B (2%). Depois de 2.000 cliques o A leva mais de 70% e o B nunca cai abaixo de 10%.

## O que já está pronto
- `GET /l/<slug>`: 302 com vid, preservando UTMs e fbclid. HEAD não grava. Robô vai para o controle sem gravar. Sem braço ativo ou banco fora do ar: página de queda.
- `POST /api/evento`: aceita só as origens cadastradas no link, conferido no servidor. Cada etapa conta 1 vez por visita. `?revisao=1` marca como teste.
- `POST /api/webhook/<projeto>/<plataforma>`: adaptador por plataforma, 401 sem autenticação, valor em reais com campo e unidade gravados (soma dos itens no order bump), idempotente, reembolso tira a venda, atribuição em 3 degraus (vid, e-mail, telefone), "Vendas sem braço", só mapa de campos (sem CPF ou endereço).
- Sorteio: Thompson com piso de 10%; fatia e chance de ser o melhor com 10 mil amostras, job de hora em hora e "Recalcular agora" com trava de 1 minuto.
- Painel com login: filtros na URL, período, auto atualização a cada 60 s, cartões no celular, funis alinhados, gargalo só com 20 ou mais pessoas, CSV com BOM e `;`, "não lido", "sem dado", "sem venda".
- Meta Ads, só leitura (`lib/meta.js`): gasto por anúncio e dia, casado pelo destino do anúncio, uma conta com falha marca a leitura inteira como falha. Token só no servidor (`META_TOKEN` no `.env`).

## Antes de rodar com dinheiro de verdade
- **[SEM DADO] Zouti**: não achei documentação pública do webhook. O modo de autenticação (token no cabeçalho `x-zouti-token`) e os campos são hipótese. Confirmar com a Zouti e fazer uma compra de teste real para ver se o `vid` volta em `src` ou `sck`.
- Aba Configurações ainda é só leitura (mostra links, braços, URL do webhook, passo a passo, últimos recebimentos e o script). Criar e editar link, braço, segredo e conta da Meta pela tela é o próximo passo.
- Produção: trocar o SQLite por Postgres num plano sem teto de escrita diário e rodar o `/l/` na borda.
- `.env` (fora do Git): `BANDIT_SENHA`, `BANDIT_CHAVE`, `META_TOKEN`, `BASE_URL`.

Na réplica, Pixel, checkout real, CRM e agenda estão desligados, para a aula não disparar nada na operação da Mentor Scale.
