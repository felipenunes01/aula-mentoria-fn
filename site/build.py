#!/usr/bin/env python3
"""Gera o site do ecossistema a partir de site/src.

  python3 site/build.py            -> site/dist/ (site real, uma pasta por rota)
  python3 site/build.py --preview  -> site/preview/ecossistema.html (versão de validação, arquivo único)
"""
import base64
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
PAGES = SRC / "pages"

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap">'
)
ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>'
FOOTER = """<footer class="footer">
  <div class="wrap">
    <div><strong style="color:var(--text);font-family:var(--font-display);letter-spacing:.12em">FELIPE NUNES</strong><br><span>Mentor e Estrategista · © <span data-ano>2026</span> Todos os direitos reservados</span></div>
    <div class="links"><a data-link="ecossistema">Ecossistema</a><a data-link="pld">PLD</a><a data-link="estrategistas">Mentoria de Estrategistas</a><a data-link="mentores">Mentoria de Mentores</a><a data-privacy target="_blank" rel="noopener">Política de privacidade</a><a data-terms target="_blank" rel="noopener">Termos de uso</a></div>
  </div>
</footer>"""

ROUTES = [  # (fragmento, pasta de saída, título, descrição, indexar)
    ("ecossistema", "", "Felipe Nunes | Ecossistema", "Programas de Felipe Nunes: PLD, Mentoria de Estrategistas e Mentoria de Mentores.", True),
    ("pld", "pld", "PLD | Profissão Lançador Digital", "Do zero ao seu primeiro lançamento digital em 30 dias com o Método 3E.", True),
    ("estrategistas", "estrategistas", "FN Strategy | Mentoria de Estrategistas", "Mentoria em grupo para estrategistas e profissionais do digital.", True),
    ("mentores", "mentores", "FN Expert | Mentoria de Mentores", "Mentoria individual para experts, especialistas e mentores.", True),
    ("obrigado-estrategistas", "obrigado/estrategistas", "Aplicação enviada | Mentoria de Estrategistas", "", False),
    ("obrigado-mentores", "obrigado/mentores", "Aplicação enviada | Mentoria de Mentores", "", False),
]
LOGOS = {"pld": "logo-pld.webp", "strategy": "logo-strategy.webp", "expert": "logo-expert.webp"}


def fill(html: str, logo_src) -> str:
    for k, f in LOGOS.items():
        html = html.replace("{{logo:%s}}" % k, logo_src(f))
    return html.replace("{{arrow}}", ARROW).replace("{{footer}}", FOOTER)


def build_dist():
    out = ROOT / "dist"
    if out.exists():
        shutil.rmtree(out)
    (out / "assets").mkdir(parents=True)
    for f in ["styles.css", "app.js", "config.js", *LOGOS.values()]:
        shutil.copy(SRC / ("assets/" + f if f.endswith(".webp") else f), out / "assets" / f)
    for frag, folder, title, desc, index in ROUTES:
        body = fill((PAGES / f"{frag}.html").read_text(), lambda f: "/assets/" + f)
        body = body.replace("data-page=", 'class="is-active" data-page=', 1)
        meta = f'<meta name="description" content="{desc}">' if desc else ""
        robots = "" if index else '<meta name="robots" content="noindex">'
        doc = (
            "<!doctype html>\n<html lang=\"pt-BR\"><head><meta charset=\"utf-8\">"
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            f"<title>{title}</title>{meta}{robots}"
            '<meta name="theme-color" content="#020816">'
            f'<meta property="og:title" content="{title}">'
            f"{FONTS}<link rel=\"stylesheet\" href=\"/assets/styles.css\"></head>\n<body>\n{body}\n"
            '<script src="/assets/config.js"></script><script src="/assets/app.js"></script>\n</body></html>\n'
        )
        dest = out / folder / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(doc)
    print("dist ok:", out)


def build_preview():
    out = ROOT / "preview"
    out.mkdir(exist_ok=True)

    def data_uri(f):
        return "data:image/webp;base64," + base64.b64encode((SRC / "assets" / f).read_bytes()).decode()

    bodies = "\n".join(fill((PAGES / f"{r[0]}.html").read_text(), data_uri) for r in ROUTES)
    override = "window.FN_CONFIG.roteamento='hash';"
    doc = (
        "<title>Ecossistema Felipe Nunes</title>\n"
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        f"{FONTS}\n<style>\n{(SRC / 'styles.css').read_text()}\n</style>\n{bodies}\n"
        f"<script>\n{(SRC / 'config.js').read_text()}\n{override}\n</script>\n"
        f"<script>\n{(SRC / 'app.js').read_text()}\n</script>\n"
    )
    (out / "ecossistema.html").write_text(doc)
    print("preview ok:", out / "ecossistema.html", len(doc) // 1024, "KB")


if __name__ == "__main__":
    build_preview() if "--preview" in sys.argv else build_dist()
