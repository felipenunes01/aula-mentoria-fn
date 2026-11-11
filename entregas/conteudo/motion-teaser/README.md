# Motion teaser: Dos Bastidores à Transformação

## v2: com narração e trilha (versão oficial)
- **Arquivo:** `teaser-dos-bastidores-v2-com-audio.mp4`, 1080×1920, 30 fps, 24,2 s, áudio AAC a -14 LUFS (padrão do Instagram).
- **Narração:** voz neural Piper "Cadu" (pt-BR, licença aberta), um semitom mais grave, com EQ, compressão e reverb leve.
- **Trilha:** sintetizada do zero em `audio_mix.py`, livre de direitos. Grave atmosférico, impactos nas batidas,
  pulsação nos bastidores, queda de tensão, riser e impacto no "HOJE" (21,6 s). A trilha abaixa quando há voz.
- **Sincronia:** `render.js` estica cada cena para casar com a duração real de cada frase.
  As frases começam em 0,9 / 6,3 / 10,4 / 14,5 / 21,55 s.

## v1 (sem áudio)

- **Arquivo:** `teaser-dos-bastidores-v1.mp4`, 1080×1920, 30 fps, 23 s, sem áudio.
- **Fonte:** `teaser.html`. A animação inteira é uma função do tempo e é renderizada quadro a quadro
  (Playwright + ffmpeg). Para mudar um texto, edite o HTML e renderize de novo.
- **Identidade:** azul-marinho, preto, off-white e dourado. Tipografia Saira expandida, a mesma das marcas.

## Tempos para encaixar a narração (CapCut)
| Tempo | Narração | Texto na tela |
| --- | --- | --- |
| 0,0–4,5 s | "Durante muito tempo, grandes histórias foram construídas longe dos holofotes." | DURANTE MUITO TEMPO… |
| 4,5–8,5 s | "Enquanto muitos enxergavam apenas os resultados…" | O PÚBLICO VIA / OS RESULTADOS. (flashes em 4,6 / 5,4 / 6,4 / 7,3 s) |
| 8,5–13,5 s | "Existia uma história acontecendo nos bastidores." | MAS EXISTIA / UMA HISTÓRIA POR TRÁS. |
| 13,5–18,5 s | "Mas algumas histórias não nasceram para ficar escondidas." | NEM TODA HISTÓRIA / DEVE FICAR ESCONDIDA. |
| 18,5–23 s | "Hoje, um novo capítulo começa." (falar "Hoje" em 21,2 s, no impacto) | DOS BASTIDORES À TRANSFORMAÇÃO / HOJE. / Uma nova fase começa. |

- **Trilha:** baixar em ~13,5 s (respiro) e crescer até o impacto de 21,2 s. Corte seco em 22,9 s.
- **Cenas com registros reais:** a cena 2 (palco) e a cena 3 (bastidores) usam visual abstrato. Com os
  vídeos autorizados, eles entram por baixo dos textos nesses trechos.
- **Não revela** nome do curso, preço nem oferta.
