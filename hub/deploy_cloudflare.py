"""Publica o hub no Cloudflare Pages (projeto felipenunes-hub) como função com o HTML embutido.
Uso: python3 hub/build.py && CF token no ambiente (proxy injeta) -> python3 hub/deploy_cloudflare.py"""
import json, pathlib, sys, uuid, urllib.request
ACC="172ab105e3f717aec89b038ccf1da089"; PROJ="felipenunes-hub"
frag=(pathlib.Path(__file__).resolve().parent / "preview.html").read_text()
head,_,rest=frag.partition("<main")
html=('<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
      '<meta name="theme-color" content="#020816">\n'+head+"</head>\n<body>\n<main"+rest+"</body></html>\n")
worker=("const HTML = "+json.dumps(html)+";\n"
"export default { async fetch(request) {\n"
"  const url = new URL(request.url);\n"
"  if (url.hostname === 'www.eusoufelipenunes.com.br') { url.hostname = 'eusoufelipenunes.com.br'; return Response.redirect(url.toString(), 301); }\n"
"  return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });\n"
"} };\n")
B="----cf"+uuid.uuid4().hex
def part(name,data,ctype,fn=None):
    return (f'--{B}\r\nContent-Disposition: form-data; name="{name}"'+(f'; filename="{fn}"' if fn else "")+f'\r\nContent-Type: {ctype}\r\n\r\n').encode()+data+b"\r\n"
body=part("manifest",b"{}","application/json")+part("branch",b"main","text/plain")+part("_worker.js",worker.encode(),"application/javascript+module","_worker.js")+f"--{B}--\r\n".encode()
req=urllib.request.Request(f"https://api.cloudflare.com/client/v4/accounts/{ACC}/pages/projects/{PROJ}/deployments",data=body,method="POST",
  headers={"Authorization":"Bearer proxy-injected","Content-Type":f"multipart/form-data; boundary={B}"})
try: r=json.load(urllib.request.urlopen(req,timeout=120))
except urllib.error.HTTPError as e: print("HTTP",e.code,e.read()[:600]); sys.exit(1)
res=r.get("result") or {}
print("success:",r.get("success"),r.get("errors"),"| url:",res.get("url"),"| worker KB:",len(worker)//1024)
