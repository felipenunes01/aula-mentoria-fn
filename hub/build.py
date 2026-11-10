#!/usr/bin/env python3
"""Gera o hub: dist/index.html (site real) e preview.html (validação, arquivo único)."""
import base64, pathlib, re, shutil
R = pathlib.Path(__file__).resolve().parent
src = (R / "hub.html").read_text()
imgs = re.findall(r"\{\{img:([\w-]+)\}\}", src)

dist = R / "dist"
(dist / "assets").mkdir(parents=True, exist_ok=True)
page = src
for n in set(imgs):
    shutil.copy(R / "assets" / f"{n}.webp", dist / "assets" / f"{n}.webp")
    page = page.replace("{{img:%s}}" % n, f"assets/{n}.webp")
head, _, rest = page.partition("<main")
(dist / "index.html").write_text(
    '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    '<meta name="theme-color" content="#020816">\n' + head + "</head>\n<body>\n<main" + rest + "</body></html>\n")

prev = src
for n in set(imgs):
    b = base64.b64encode((R / "assets" / f"{n}.webp").read_bytes()).decode()
    prev = prev.replace("{{img:%s}}" % n, "data:image/webp;base64," + b)
(R / "preview.html").write_text(prev)
print("ok", len(prev) // 1024, "KB")
