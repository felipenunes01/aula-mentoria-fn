# Site do Ecossistema Felipe Nunes

São 6 páginas geradas a partir de um código só:

| Rota | Página |
| --- | --- |
| `/` | Meu Ecossistema (link da bio) |
| `/pld/` | Página de vendas do PLD |
| `/estrategistas/` | Mentoria de Estrategistas + aplicação em 6 etapas |
| `/mentores/` | Mentoria de Mentores + aplicação em 6 etapas |
| `/obrigado/estrategistas/` | Confirmação + WhatsApp |
| `/obrigado/mentores/` | Confirmação + WhatsApp |

## Onde mexer
- **`src/config.js`**: WhatsApp, checkout do PLD, endpoint das candidaturas, foto, links legais e rotas. Tudo o que está pendente se configura aqui.
- `src/pages/*.html`: textos das páginas.
- `src/styles.css`: visual. Cada programa tem a sua paleta em `[data-brand]`.
- `src/app.js`: rotas, mensuração, formulários e WhatsApp.

## Gerar e publicar
```bash
python3 site/build.py            # gera site/dist/ (site real)
python3 site/build.py --preview  # gera site/preview/ecossistema.html (versão de validação)
```
Para publicar, suba a pasta `site/dist/` na Vercel, Netlify ou Cloudflare Pages, aponte o
domínio e coloque o domínio na bio do Instagram. Depois de editar `config.js` no painel,
rode o build de novo.

## Formulários
O envio vai para a planilha Google pelo Apps Script (`backend/`). Se `endpointCandidaturas`
estiver vazio no site real, o envio mostra erro e guarda as respostas no aparelho. Nunca
mostra sucesso falso.

## Mensuração (window.dataLayer, pronto para GTM)
`visita_ecossistema`, `clique_caminho`, `clique_programa`, `visita_pld`, `clique_checkout_pld`,
`visita_estrategistas`, `visita_mentores`, `clique_candidatura`, `inicio_aplicacao`,
`aplicacao_concluida`, `clique_whatsapp`.
As UTMs da URL ficam salvas e vão junto com a candidatura e com o link do checkout.
