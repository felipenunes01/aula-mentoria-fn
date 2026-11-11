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
- 2026-11-10: Logos novos do FN Expert e do FN Strategy chegaram em PNG transparente (azul-marinho):
  para fundo escuro basta trocar o azul-marinho por branco mantendo o alfa original (não converter
  para RGB antes, senão o fundo vira preto). Origem: arquivos enviados pelo dono.
- 2026-11-10: O hub do link da bio é um site SEPARADO dos sites dos produtos (pasta `hub/`). Ele deve
  ser simples, como a referência: avatar, nome e 3 cards na identidade de cada produto, com link externo.
  Não misturar o hub com as páginas dos programas e fazer uma entrega por vez, na ordem pedida. Origem: correção do dono.
- 2026-11-10: Hub deve caber em UMA tela no celular, sem rolagem (testar em 390x844 e 375x667). Foto de
  perfil com enquadramento aberto (ombros), não colada no rosto. Instagram com ícone + @ clicável.
  PLD tem identidade branca com logo preto para se diferenciar das mentorias (azul-marinho). Origem: dono.
- 2026-11-10: No hub não mostrar preço nem rótulos como "entrada" ou "comece por aqui". Cada card leva só
  a descrição e o botão: "Profissão Lançador Digital", "Mentoria em grupo para estrategistas digitais",
  "Mentoria individual para experts e especialistas". Origem: dono.
- 2026-11-10: Deploy na Cloudflare Pages a partir da sessão: o `wrangler pages deploy` falha porque o
  proxy sobrescreve o token JWT de upload. A API direta de deployments (multipart com manifest de hashes
  blake3) funciona. Publicar e mexer em DNS exigem confirmação explícita do dono. Origem: deploy do hub.
- 2026-11-10: Deploy de arquivos estáticos no Pages pela sessão "funciona" na API, mas o site responde 500
  porque os arquivos não sobem. Solução: publicar como função `_worker.js` com o HTML embutido
  (`hub/deploy_cloudflare.py`). Sempre testar a URL publicada antes de dizer que está no ar. Origem: hub fora do ar.
- 2026-11-10: O navegador interno do Instagram tem a tela útil mais baixa (testar ~430x700, além de
  390x844, 375x667 e 360x640). Card com altura fixa corta o conteúdo: usar `minmax(min-content, 1fr)`
  e medir no teste se algum texto, botão ou arte passa da borda do card. Origem: print do dono no iPhone.
- 2026-11-10: Motion em vídeo é viável na sessão: animação em HTML/canvas como função do tempo,
  renderizada quadro a quadro com Playwright e ffmpeg (MP4 1080x1920). Sem gerar voz nem trilha: entregar
  junto a tabela de tempos para encaixar no CapCut. Base: `entregas/conteudo/motion-teaser/`. Origem: pedido do dono.
