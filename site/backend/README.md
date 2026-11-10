# Backend das candidaturas (Google Sheets)

Grava as aplicações das 2 mentorias numa planilha Google, com uma aba por programa
(`Estrategistas` e `Mentores`) criada automaticamente. Não tem custo e não precisa de servidor.

## Instalação (5 minutos)
1. Crie uma planilha no Google Sheets, por exemplo "Candidaturas Ecossistema FN".
2. Abra **Extensões > Apps Script**, apague o conteúdo e cole o arquivo `Code.gs`.
3. Clique em **Implantar > Nova implantação > Tipo: App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Autorize e copie a URL que termina em `/exec`.
5. Cole a URL em `site/src/config.js`, no campo `endpointCandidaturas`, e rode `python3 site/build.py`.

## O que o backend faz
- Valida tudo no servidor: programa, nome completo, WhatsApp BR com DDD, as 4 respostas e o consentimento.
- Bloqueia spam com 3 filtros: campo oculto, tempo mínimo de preenchimento e duplicado do mesmo WhatsApp em 2 minutos.
- Protege a planilha contra injeção de fórmulas.
- Responde `ok: true` somente depois de gravar. A página só leva a pessoa para o obrigado e para o WhatsApp depois dessa confirmação.
- Registra também data e hora, UTMs, página de origem, tempo de preenchimento e o status inicial "Nova aplicação".

A coluna **Status** fica livre para o comercial: Em contato, Em avaliação, Qualificada,
Não qualificada, Convertida.

> Toda alteração no `Code.gs` exige **Implantar > Gerenciar implantações > Editar > Nova versão**.
