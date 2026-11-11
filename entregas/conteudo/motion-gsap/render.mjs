// Renderiza index.html quadro a quadro em frames/%05d.png (Playwright + Chromium headless).
// Uso: node render.mjs            -> todos os quadros
//      node render.mjs --preview  -> só 0%, 20%, 40%, 60%, 80% e 100% em preview/
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
// Playwright local ou global (o ambiente de render pode ter uma instalação global em NODE_PATH ou /opt/node-tools)
let chromium;
for (const cand of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
  try { ({ chromium } = require(cand)); break; } catch {}
}
if (!chromium) throw new Error("Playwright não encontrado: rode npm i -D playwright");

const dir = path.dirname(fileURLToPath(import.meta.url));
const preview = process.argv.includes("--preview");
const outDir = path.join(dir, preview || process.argv.some((a) => a.startsWith("--frames=")) ? "preview" : "frames");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(pathToFileURL(path.join(dir, "index.html")).href, { waitUntil: "load" });
await page.evaluate(() => window.ready);

const FPS = await page.evaluate(() => window.FPS);
const TOTAL = Math.round((await page.evaluate(() => window.DURATION)) * FPS);
// --frames=48,255 renderiza só os quadros pedidos (útil para conferir momentos específicos)
const custom = process.argv.find((a) => a.startsWith("--frames="));
const frames = custom
  ? custom.slice(9).split(",").map(Number)
  : preview
  ? [0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => Math.min(TOTAL - 1, Math.round(p * (TOTAL - 1))))
  : Array.from({ length: TOTAL }, (_, i) => i);

for (const i of frames) {
  await page.evaluate((t) => window.seek(t), i / FPS);
  await page.screenshot({ path: path.join(outDir, `${String(i).padStart(5, "0")}.png`) });
  if (!preview && i % 90 === 0) console.log(`quadro ${i}/${TOTAL}`);
}
await browser.close();
if (errors.length) { console.error("Erros na página:", errors); process.exit(1); }
console.log(`${frames.length} quadros em ${path.relative(dir, outDir)}/ (total esperado: ${custom ? frames.length : preview ? 6 : TOTAL})`);
