# Motion GSAP: Dos Bastidores à Transformação

Motion graphic programático: HTML, CSS e canvas com uma única `gsap.timeline({ paused: true })`,
renderizado quadro a quadro de forma determinística.

- **Vídeo:** `motion.mp4`. H.264, yuv420p, CRF 18, preset slow, +faststart. 1080×1920, 30 fps, 540 quadros, 18 s, sem áudio.
- **Decisões:** `storyboard.md` (roteiro, tempos, animação de cada bloco e motivo).
- **Conferência:** `contact-sheet-preview.png` (0/20/40/60/80/100%) e `contact-sheet.png` (1 quadro a cada 1,5 s do MP4 final).

## Renderizar de novo
```bash
cd entregas/conteudo/motion-gsap
node render.mjs --preview          # 6 quadros de conferência em preview/
node render.mjs                    # 540 quadros em frames/
ls frames/*.png | wc -l            # deve dar 540
ffmpeg -y -framerate 30 -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart motion.mp4
rm -rf frames preview
```
Requer Node 18+ e Playwright com Chromium (`npm i -D playwright && npx playwright install chromium`, se não houver uma instalação global).

## Arquivos
- `index.html`: palco, estilos e timeline comentada por bloco. Expõe `window.ready` (fontes carregadas) e `window.seek(t)`.
- `render.mjs`: captura com Playwright (viewport 1080×1920, deviceScaleFactor 1). Aceita `--preview` e `--frames=30,215`.
- `assets/`: GSAP 3.12.5 e as fontes Inter 500/800 e JetBrains Mono 500/700 (woff2 locais).

## Determinismo
Cada quadro é função pura do tempo da timeline. Não há requestAnimationFrame, timers nem Date.now. O embaralhamento usa
mulberry32 com semente 42, avançado a cada 2 quadros. Três quadros renderizados duas vezes deram arquivos idênticos.
