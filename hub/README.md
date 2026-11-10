# Hub do link da bio (site próprio)

Página simples, igual à referência enviada pelo dono: avatar, nome e 3 cards (PLD, FN Strategy, FN Expert),
cada um na identidade visual do seu produto, levando para o **site externo** de cada um.

- Editar: `hub/hub.html`. A configuração fica no topo do `<script>` (objeto `HUB`): @, foto e os 3 links.
- Gerar: `python3 hub/build.py`, que cria `hub/dist/` (para publicar na Vercel/Netlify) e `hub/preview.html` (validação).
- Card sem link configurado mostra "Link em configuração".
- Mensuração: cada clique envia `clique_hub` com o produto para `window.dataLayer`.

Os sites dos produtos são projetos separados, construídos depois do hub.

## Publicação (Cloudflare Pages)
- Projeto: `felipenunes-hub`, na conta Cloudflare do dono. **No ar em https://eusoufelipenunes.com.br** desde 2026-11-10 (www redireciona).
- O endereço provisório é `felipenunes-hub.pages.dev`.
- DNS: um CNAME de `@` e um de `www` para `felipenunes-hub.pages.dev`, ambos com proxy (nuvem laranja).
- Atualizar: `python3 hub/build.py && python3 hub/deploy_cloudflare.py`. O hub sobe como função
  (`_worker.js`) com o HTML e as imagens embutidos. O upload de arquivos estáticos falha pelo proxy da
  sessão e o site responde 500, por isso não usar esse caminho. O www redireciona para o domínio principal.
