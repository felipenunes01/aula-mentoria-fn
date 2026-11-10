# Estrutura de página de vendas: modelo visual "Cansei Dessa Vida"

- **Data:** 2026-11-10
- **Referência:** https://canseidessavida.com.br/captura-cdv/ (página de captura de evento gratuito, 3 aulas)
- **Objetivo:** reaproveitar o **design** (sistema visual e componentes) numa **página de vendas**, em 2 versões: **VSL** e **Simples (texto)**. A estrutura de copy é nova e não segue a da captura.
- **Prints:** `entregas/design/referencias/cdv-desktop.jpg` e `cdv-mobile.jpg`
- **Setores:** Funil e Lançamento (estrutura), Design (sistema visual). A Copy entra quando chegar o texto.

---

## 1. Raio-X da página de referência (como ela é hoje)

A página tem 4.200px no desktop e 5.580px no mobile. São 6 blocos, com fundo escuro quase preto e vermelho como cor de ação.

| # | Bloco | O que tem | Função |
|---|---|---|---|
| 1 | **Hero** (tela cheia, foto do expert à direita) | Logo + pílula de data/hora · H1 em caixa alta com trechos em gradiente vermelho · parágrafo com negritos · formulário (nome, e-mail, WhatsApp +55) · botão vermelho com seta ↗ · selo "3 dias. 100% gratuito." | Promessa e conversão logo de cara |
| 2 | **"O que vou te mostrar nas 3 aulas"** | H2 centralizado · 3 cards verticais (315×560) com imagem de fundo, tag "AULA 01", data e título com negrito | Conteúdo e entregáveis |
| 3 | **Antes / Depois** (fundo um tom mais claro) | Tags "ANTES" e "DEPOIS" · 4 fotos 2+2 com cantos arredondados · parágrafo centralizado | Prova de transformação |
| 4 | **Quem é o expert** | Avatar estilo perfil verificado (@) · H2 "Quem é" em gradiente · 5 parágrafos curtos de história · CTA · foto grande à direita | Autoridade e identificação |
| 5 | **Fechamento / oportunidade** | H2 centralizado com palavra-chave em gradiente · 2 parágrafos · CTA centralizado | Urgência e "por que agora" |
| 6 | **Rodapé** | Linha divisória · logo · direitos e links de termos/privacidade | Compliance |

**O que faz o design funcionar:**
1. **Contraste brutal:** fundo quase preto, texto claro e um único vermelho que só aparece em ação e destaque. O olho vai direto pro CTA.
2. **Destaque em gradiente** em 2 a 4 palavras por título, nunca no título inteiro.
3. **Negrito estratégico** no corpo: o leitor que só escaneia lê a mensagem pelos negritos.
4. **Ritmo de fundo:** os blocos alternam `#130101` e `#261313`, o que separa as seções sem usar linha.
5. **Foto do expert com tratamento vermelho** (luz dura, glow) no hero e nos cards. A identidade está mais na foto que no layout.
6. **Botão com glow** (sombra vermelha difusa) e seta ↗ indicando ação.

---

## 2. Design system extraído (tokens)

### Cores
| Token | Valor | Uso |
|---|---|---|
| `--bg-0` | `#0B0404` | Fundo do hero |
| `--bg-1` | `#130101` | Fundo padrão das seções |
| `--bg-2` | `#261313` | Seção alternada (prova) |
| `--bg-footer` | `#140C0C` (aprox.) | Rodapé |
| `--surface-chip` | `#390E0D` | Pílula de data, selo, caixas de destaque |
| `--tag` | `#A01414` | Tags (AULA 01, ANTES, DEPOIS) |
| `--text-strong` | `#F4F6F8` | Títulos |
| `--text` | `#FFFFFF` | Corpo em seções escuras |
| `--text-muted` | `#BCC4CC` | Parágrafo do hero |
| `--text-dim` | `#8E8E8E` | @usuário, legendas |
| `--input-bg` | `rgba(0,0,0,.22)` + borda clara fina | Campos |
| `--grad-highlight` | `linear-gradient(90deg,#FF0000 48%,#FBBCAD 100%)` | Palavras de destaque (texto com `background-clip:text`) |
| `--grad-cta` | `linear-gradient(90deg,#F80D13 0%,#EE444F 34%,#E64C55 66%,#C40205 100%)` | Botões |

### Tipografia
| Elemento | Fonte | Tamanho desktop | Peso | Obs. |
|---|---|---|---|---|
| H1 hero | DM Sans | 40px / ~52px de entrelinha | 500 | CAIXA ALTA, até ~600px de largura |
| H2 seção | DM Sans | 36px | 600 | Caixa normal |
| H3 card | DM Sans | 22px | 300 com trechos em 600 | |
| Corpo | DM Sans | 18px / ~25px de entrelinha | 300 (negrito 700) | Light é a assinatura: o negrito salta |
| Botão | Sora | 20px | 700 | CAIXA ALTA + ícone ↗ |
| Pílulas, rodapé | Inter | 14 a 16px | 300 a 600 | |
| Tags | DM Sans | 10,5px | 400 | Espaçamento entre letras largo |

As 3 fontes são gratuitas no Google Fonts.

### Formas e espaçamento
- Container de **1216px** (margem lateral de 112px em tela de 1440px). Coluna de texto do hero com ~600px.
- Raios: **12px** em botão e input, **24px** em card e foto, **8px** em pílula, **5 a 6px** em tag.
- Botão com 60 a 70px de altura, largura total da coluna, glow `0 10px 40px rgba(248,13,19,.35)` (aprox.).
- Seções com ~80 a 110px de respiro vertical.
- **Mobile:** foto do expert sobe para o topo do hero, cards empilham em 1 coluna e inputs ficam 100%. O H1 continua em caixa alta.

---

## 3. Biblioteca de componentes (para reaproveitar na página de vendas)

| Código | Componente | Origem no modelo | Reuso na página de vendas |
|---|---|---|---|
| C1 | Header com logo + pílula informativa | Hero | Pílula vira "Acesso imediato", "Turma X" ou "Oferta até DD/MM" |
| C2 | H1 com gradiente parcial | Hero | Headline da promessa |
| C3 | Parágrafo light com negritos | Hero | Subheadline |
| C4 | Botão CTA vermelho com glow e ↗ | Hero, Quem é, Fechamento | Todos os CTAs (substitui o formulário) |
| C5 | Selo/caixa de reforço com ícone ✓ | Abaixo do botão | Garantia, "pagamento seguro", "acesso imediato" |
| C6 | Cards verticais com imagem + tag + título | 3 aulas | Módulos, pilares, entregáveis, bônus |
| C7 | Bloco Antes/Depois com tags | Prova | Depoimentos com print/foto de alunos |
| C8 | Bio do expert (avatar verificado + texto + foto grande) | Quem é | Autoridade |
| C9 | Bloco centralizado de virada | Fechamento | Mecanismo, "por que agora", CTA final |
| C10 | Rodapé | Rodapé | Igual, com CNPJ e links |

**Componentes que o modelo não tem e a página de vendas precisa** (criar no mesmo estilo):
- **C11 Player de VSL:** moldura com raio de 24px, borda `--surface-chip` e glow vermelho leve.
- **C12 Card de oferta/preço:** fundo `--bg-2`, borda vermelha de 1px, lista de itens com ✓, preço "De/Por" (parcelado grande, à vista menor) e C4 + C5.
- **C13 Grade de depoimentos:** cards de print ou vídeo, 3 colunas no desktop e carrossel no mobile.
- **C14 Bloco "Para quem é / para quem não é":** 2 colunas, ✓ vermelho e ✕ cinza.
- **C15 Garantia:** selo circular + texto, no fundo `--bg-2`.
- **C16 FAQ em acordeão:** linhas com divisória fina e "+" vermelho.
- **C17 Barra fixa de CTA no mobile** (opcional): aparece após o primeiro scroll.

---

## 4. Estrutura da página de vendas: 2 versões

> A copy de cada bloco entra quando você mandar o texto. Abaixo ficam a ordem, o papel de cada bloco e o componente que ele usa.

### Versão A: VSL

Lógica: o vídeo faz a venda e a página só sustenta. Por isso, pouco texto antes do vídeo, botão abaixo dele e o restante da página para quem rola sem assistir.

| # | Bloco | Papel | Componentes |
|---|---|---|---|
| A1 | Header + headline curta | Prender para dar o play | C1, C2 (1 a 2 linhas) |
| A2 | **VSL** | Vender | C11 (largura de ~900px, centralizado; no mobile vem logo após a headline) |
| A3 | CTA abaixo do vídeo | Converter quem decidiu | C4 + C5 (pode aparecer com atraso, após o pitch no vídeo) |
| A4 | Para quem é | Qualificar | C14 |
| A5 | O que você recebe | Tornar a oferta tangível | C6 (módulos em cards) |
| A6 | Prova / transformação | Quebrar a descrença | C7 + C13 |
| A7 | Quem é o expert | Autoridade | C8 |
| A8 | Oferta + bônus + preço | Fechar | C12 |
| A9 | Garantia | Tirar o risco | C15 |
| A10 | FAQ | Matar objeções | C16 |
| A11 | Fechamento + CTA final | Urgência | C9 + C4 |
| A12 | Rodapé | Compliance | C10 |

### Versão B: Simples (texto, sem vídeo)

Lógica: a página precisa vender sozinha, na sequência problema, mecanismo, prova e oferta. É mais longa e tem CTA a cada 2 ou 3 blocos.

| # | Bloco | Papel | Componentes |
|---|---|---|---|
| B1 | Hero: headline + sub + CTA + selo + foto do expert | Promessa | C1, C2, C3, C4, C5 (layout idêntico ao modelo, trocando o formulário pelo botão) |
| B2 | Identificação / dor | "É comigo" | C9 (texto centralizado, palavra de dor em gradiente) |
| B3 | Mecanismo / a nova oportunidade | Por que funciona e por que agora | C9 ou texto + imagem |
| B4 | Prova / transformação | Credibilidade | C7 + C13, depois CTA |
| B5 | O que você recebe | Entregáveis | C6 |
| B6 | Para quem é / não é | Qualificar | C14 |
| B7 | Quem é o expert | Autoridade | C8, depois CTA |
| B8 | Oferta + bônus + preço | Fechar | C12 |
| B9 | Garantia | Tirar o risco | C15 |
| B10 | FAQ | Objeções | C16 |
| B11 | Fechamento + CTA final | Urgência | C9 + C4 |
| B12 | Rodapé | Compliance | C10 |

**Ritmo de fundo sugerido (nas duas versões):** `bg-0` (hero) → `bg-1` → `bg-2` (prova) → `bg-1` → `bg-2` (oferta e garantia) → `bg-1` → rodapé. A prova e a oferta ficam nas seções mais claras, porque são os momentos que mais pesam na decisão.

---

## 5. O que preciso de você para montar

1. **Copy completa** de cada versão. Se vier num texto único, eu distribuo nos blocos acima.
2. **Produto, preço, parcelamento, bônus e garantia.**
3. **Assets:** logo, fotos do expert (de preferência com tratamento de luz igual ao do modelo), provas reais com autorização e link do vídeo da VSL.
4. **Paleta:** manter o vermelho do modelo ou adaptar à marca do expert? Os tokens da seção 2 trocam em um lugar só.
5. **Onde vai rodar:** HTML próprio, Elementor ou WordPress, Astro (o modelo é em Astro) ou outra plataforma.
6. **Link do checkout** (Hotmart, Kiwify etc.) para os botões.

**Regra:** nenhum depoimento, número ou resultado entra sem fonte. Onde faltar, fica marcado [SEM DADO].
