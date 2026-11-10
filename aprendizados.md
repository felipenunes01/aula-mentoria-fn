# Aprendizados

Registre aqui, com data, o que funcionou, o que não funcionou e o que o dono pediu para não repetir.

- 2026-10-21: O gestor de tráfego (subagente `trafego-pago`) passa a usar sempre a skill
  `traffic-masters` (16 especialistas, 9 tasks, 2 workflows, benchmarks e checklist). Campanha
  nova segue `wf-campaign-launch`. Origem: pedido do dono, zip Gestor-trafego-Xquads.
- 2026-11-10: Para extrair modelo de página de referência, renderizar com Playwright (prints
  desktop/mobile + estilos computados) dá tokens exatos de cor, fonte e espaçamento. O domínio
  precisa estar liberado na rede do ambiente. Página de vendas do dono terá 2 versões (VSL e
  simples) usando o visual do "Cansei Dessa Vida". Origem: pedido do dono, estrutura em
  `entregas/design/estrutura-pagina-vendas-modelo-cdv.md`.
- 2026-11-10: Ecossistema Felipe Nunes construído em `site/` (build único gera site real e versão de
  validação). Página publicada no claude.ai só grava dados para quem está logado, então formulário
  público real precisa de backend próprio (Apps Script + Google Sheets em `site/backend/`). No CSS de
  produção, `[hidden]` precisa de `display:none !important`, senão os passos do formulário aparecem
  todos juntos. Origem: pedido do dono, Documento-Mestre do Ecossistema V1.0.
- 2026-11-10: Hub do ecossistema no formato link da bio (referência enviada pelo dono): avatar redondo,
  nome/@, cards-banner empilhados com logo + "SAIBA MAIS" à esquerda e imagem à direita. Fotos dos cards
  e @ configuráveis em `site/src/config.js` (`marca.arroba`, `marca.fotosCards`). Origem: print de
  referência do dono.
