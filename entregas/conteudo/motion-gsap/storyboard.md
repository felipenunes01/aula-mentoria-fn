# Storyboard: Dos Bastidores à Transformação (motion GSAP)

**Formato:** 1080×1920, 30 fps, **18 s = 540 quadros**.
**Paleta:** fundo #1F1D2B, texto #F4F4F9, destaque #FF7551, apoio #8B7CF6.
**Tipos:** Inter 800 nos títulos, Inter 500 no apoio, JetBrains Mono 500 e 700 nas animações monoespaçadas.

> **Aviso de duração:** o pedido era de cerca de 8 s (240 quadros). O roteiro tem 5 blocos e 28 palavras na tela.
> Com máquina de escrever (20 car/s) e decodificação (800 ms), a leitura calma pede 18 s, ou seja, **+125%**.
> Isso continua dentro dos 20 a 25 s indicados no briefing.

## Roteiro (um bloco = uma frase)
1. Durante muito tempo…
2. O público via os resultados.
3. Mas existia uma história por trás.
4. Nem toda história deve ficar escondida.
5. Dos bastidores à transformação. HOJE. Uma nova fase começa.

## Estimativa de leitura
Base de ~3 palavras/s, mais o tempo próprio de cada animação e um respiro de 0,8 a 1,2 s para ler.

| Bloco | Palavras | Animação | Tempo mínimo | Tempo dado |
| --- | --- | --- | --- | --- |
| 1 | 3 | Máquina de escrever (20 car/s, cursor pisca 2 vezes) | 2,5 s | 3,0 s |
| 2 | 5 | Entrada cinética (padrão expo) | 2,6 s | 3,4 s |
| 3 | 6 | Texto decodificado (800 ms por linha) | 3,2 s | 3,6 s |
| 4 | 6 | Grade em onda + entrada cinética | 3,0 s | 3,6 s |
| 5 | 8 | Grade em onda (fundo) + revelação tipográfica | 3,6 s | 4,4 s |

## Blocos

| # | Início → fim (s) | Quadros | Texto em tela | Animação | Motivo |
| --- | --- | --- | --- | --- | --- |
| 1 | 0,00 → 3,00 | 0 → 89 | DURANTE MUITO TEMPO… | **Máquina de escrever**: mono, 20 car/s a partir de 0,40 s, cursor em bloco piscando a cada 500 ms, pisca 2 vezes e some. Saída em 2,60 s (expo.in, sobe 60 px). | A história "sendo escrita" letra a letra passa a ideia de tempo correndo e abre com mistério. |
| 2 | 3,00 → 6,40 | 90 → 191 | O público via / **os resultados.** | **Entrada cinética padrão**: Inter 500 (apoio) sobe 60 px; depois as palavras do título em Inter 800, com stagger de 60 ms, escala de 80% para 100%, expo.out em 500 ms. "resultados." em destaque #FF7551. Saída em 6,00 s. | É o que todo mundo vê: entrada rápida, limpa e "de palco". O destaque marca o único foco do bloco. |
| 3 | 6,40 → 10,00 | 192 → 299 | Mas existia / UMA HISTÓRIA / POR TRÁS. | **Texto decodificado**: mono 700; caracteres embaralhados (mulberry32 com semente 42, troca a cada 2 quadros) se resolvem da esquerda para a direita em 800 ms. Os não resolvidos ficam em #FF7551. Linha 2 em 6,80 s e linha 3 em 7,50 s. Saída em 9,60 s. | Uma história escondida que vai sendo revelada é a tradução literal de "bastidores". Varia em relação ao bloco 2. |
| 4 | 10,00 → 13,60 | 300 → 407 | Nem toda história / **deve ficar escondida.** | **Grade em onda** (pontos a cada 32 px, escala = 1 + 0,6·sin(t·2π − d·0,15)) entra como transição em 10,00 s, em #8B7CF6. Texto com entrada cinética padrão em 10,40 s e 10,70 s. Saída do texto em 13,20 s; a grade fica e esmaece para 35%. | O pulso que se espalha a partir do centro é a história "saindo do esconderijo" e ganhando alcance. |
| 5 | 13,60 → 18,00 | 408 → 539 | Dos bastidores / **à transformação** / **HOJE.** / Uma nova fase começa. | Grade de fundo a 35%. "Dos bastidores" (500) em 13,80 s; "à transformação" (800) em 14,10 s; linha cresce em 14,60 s. **"HOJE."** em #FF7551, escala de 110% para 100% em 15,20 s (ênfase, sobe um nível). "Uma nova fase começa." em #8B7CF6 em 15,90 s. Segura até 18,00 s e termina em corte seco. | É a revelação: um foco por vez, com o destaque reservado só para o HOJE. |

## Margens
- Laterais: no mínimo 65 px (6%). Topo: no mínimo 115 px (6%).
- Base: os 20% inferiores (y > 1536 px) ficam livres para a interface do Reels.
- Todo texto fica centrado entre y = 640 e y = 1260.

## Trocas registradas
- Nenhuma até agora. Se alguma animação não funcionar na prática, a troca fica registrada aqui.
