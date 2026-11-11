const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const out = process.argv[2], FPS = 30;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file:///home/user/aula-mentoria-fn/entregas/conteudo/motion-teaser/teaser.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const MAP=[[0,0],[6.1,4.5],[10.0,8.5],[13.9,13.5],[18.9,18.5],[21.6,21.2],[24.2,23.0]]; const warp=r=>{for(let k=1;k<MAP.length;k++){const[a,da]=MAP[k-1],[b,db]=MAP[k]; if(r<=b) return da+(r-a)/(b-a)*(db-da);} return 23;}; const DUR=24.2; const N=Math.round(DUR*FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(FPS), out]);
  ff.stderr.on('data', d => process.stderr.write(d));
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => renderAt(t), warp(i / FPS));
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`quadro ${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('pronto', N, 'quadros');
})();
