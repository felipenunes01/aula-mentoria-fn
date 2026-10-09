# Central de marketing com squads de IA

## Como trabalhar aqui
1. Leia `contexto/` e `aprendizados.md` antes de criar qualquer coisa.
2. Roteamento automático: o usuário não precisa citar squad nem especialista.
   Identifique o setor pela tabela abaixo e delegue ao subagente do setor
   (`.claude/agents/`). Diga em uma linha qual setor vai atuar e por quê.
3. Tarefa que atravessa setores: encadeie na ordem lógica, passando a entrega
   de um para o outro. Ex.: pesquisa-publico, depois oferta-preco, depois copy,
   depois design-criativos, depois trafego-pago.
4. Se o usuário citar um especialista pelo nome, respeite e use esse.
5. Pedido que não encaixa em setor nenhum: use a skill `xquads` para
   diagnosticar.

## Setores
| Quando o pedido é sobre | Setor (subagente) |
| --- | --- |
| diagnóstico, modelo de negócio, escala, prioridade, decisão | estrategia-negocio |
| público, ICP, persona, dor, objeção, concorrente, mercado | pesquisa-publico |
| oferta, produto, preço, bônus, garantia, upsell | oferta-preco |
| marca, posicionamento, tom de voz, nome, manifesto, comunidade | marca-posicionamento |
| anúncio escrito, headline, página de vendas, VSL, e-mail | copy |
| post, Reels, gancho, carrossel, linha editorial, história, palestra | conteudo-storytelling |
| campanha, Meta Ads, Google Ads, verba, CPL, CPA, ROAS, escala | trafego-pago |
| funil, captura, webinário, workshop, desafio, lançamento | funil-lancamento |
| call de vendas, script, WhatsApp, objeção, negociação, pitch | vendas-fechamento |
| criativo visual, arte, imagem, identidade visual, layout | design-criativos |
| métricas, relatório, Pixel, UTM, retenção, LTV, churn | dados-metricas |

## Memória
- A sessão é descartável: o que fica é o que está no Git.
- Dado novo do negócio vai para `contexto/`.
- Ao fim de toda tarefa, registre em `aprendizados.md` o que vale para as
  próximas (data, o aprendizado, de onde veio).
- Entregas ficam em `entregas/<setor>/`.

## Git e a main
- Trabalhe sempre numa branch, nunca direto na main.
- Ao terminar: commit com mensagem clara, push, abra o PR e mande o link.
- Pergunte "Posso mergear na main?". Com sim, faça o merge se esta sessão tiver
  a ferramenta do GitHub; se não tiver, peça para o dono clicar em
  "Merge pull request" no link do PR.
- Lembre o dono: só o que está na main aparece nas próximas sessões.

## Regras
- Não invente depoimento, número, resultado ou caso. Sem fonte: [SEM DADO].
- Não suba, pause nem altere campanha, página ou integração real sem
  autorização explícita do dono.
- Nunca commite senha, token ou chave. Use `.env`, que fica fora do Git.
