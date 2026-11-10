# Hub do link da bio (site próprio)

Página simples, igual à referência enviada pelo dono: avatar, nome e 3 cards (PLD, FN Strategy, FN Expert),
cada um na identidade visual do seu produto, levando para o **site externo** de cada um.

- Editar: `hub/hub.html`. A configuração fica no topo do `<script>` (objeto `HUB`): @, foto e os 3 links.
- Gerar: `python3 hub/build.py`, que cria `hub/dist/` (para publicar na Vercel/Netlify) e `hub/preview.html` (validação).
- Card sem link configurado mostra "Link em configuração".
- Mensuração: cada clique envia `clique_hub` com o produto para `window.dataLayer`.

Os sites dos produtos são projetos separados, construídos depois do hub.
