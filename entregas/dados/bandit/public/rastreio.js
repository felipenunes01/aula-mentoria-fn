/* Script de rastreio do Bandit. Cole no quiz ou na página de cada braço:
   <script src="https://SEU-BANDIT/bandit.js" data-checkout="src"></script>
   Funções para quem monta o quiz:
     bandit.etapa(3, "Qual a idade do seu filho?")
     bandit.final()
     bandit.lead(email, telefone)          // vai em SHA-256, nunca em claro
     location.href = bandit.checkout(urlDoCheckout)
   ?revisao=1 na URL: tudo vai marcado como teste e não conta. */
(function () {
  'use strict';
  if (window.bandit) return;
  var S = document.currentScript;
  var API = (S && S.src) ? new URL(S.src, location.href).origin : location.origin;
  var PARAMS = String((S && S.getAttribute('data-checkout')) || 'src').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var q = new URLSearchParams(location.search);

  var st = {};
  try { st = JSON.parse(sessionStorage.getItem('bandit') || '{}') || {}; } catch (e) {}
  if (q.get('vid')) st = { vid: q.get('vid'), link: q.get('link'), braco: q.get('braco'), utm: {} };
  if (q.get('revisao') === '1') st.revisao = 1;
  st.utm = st.utm || {};
  q.forEach(function (v, k) { if (/^utm_|^fbclid$/.test(k)) st.utm[k] = v; });
  st.feitos = st.feitos || {};
  function guarda() { try { sessionStorage.setItem('bandit', JSON.stringify(st)); } catch (e) {} }
  guarda();

  function manda(tipo, extra) {
    if (!st.vid) return; /* página aberta direto: segue funcionando, não conta */
    var chave = tipo + ':' + ((extra && extra.passo) || 0);
    if (st.feitos[chave]) return;
    st.feitos[chave] = 1; guarda();
    var c = { vid: st.vid, link: st.link, braco: st.braco, tipo: tipo, passo: 0, nome: '', quando: new Date().toISOString(), teste: st.revisao ? 1 : 0 };
    for (var k in (extra || {})) c[k] = extra[k];
    var corpo = JSON.stringify(c);
    try {
      /* text/plain: o sendBeacon entre domínios não aceita application/json */
      if (navigator.sendBeacon && navigator.sendBeacon(API + '/api/evento', new Blob([corpo], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(API + '/api/evento', { method: 'POST', body: corpo, keepalive: true, mode: 'cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  }

  function sha256(txt) {
    if (!txt || !window.crypto || !crypto.subtle) return Promise.resolve(null);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function normEmail(e) { return String(e || '').trim().toLowerCase().replace(/\s+/g, ''); }
  function normTel(t) { var d = String(t || '').replace(/\D+/g, ''); if (!d) return ''; return d.length <= 11 ? '55' + d : d; }

  var bandit = {
    get vid() { return st.vid || null; },
    get braco() { return st.braco || null; },
    comecou: function () { manda('comecou'); },
    etapa: function (passo, nome) { manda('comecou'); manda('etapa', { passo: Number(passo) || 0, nome: String(nome || '').slice(0, 140) }); },
    final: function () { manda('final'); },
    lead: function (email, tel) {
      return Promise.all([sha256(normEmail(email)), sha256(normTel(tel))]).then(function (h) {
        manda('lead', { email_h: h[0], tel_h: h[1] });
      });
    },
    /* devolve a URL do checkout com o vid no parâmetro que a plataforma devolve
       no webhook, e as UTMs repassadas */
    checkout: function (url) {
      manda('checkout');
      if (!url) return url;
      try {
        var u = new URL(url, location.href);
        if (st.vid) PARAMS.forEach(function (p) { u.searchParams.set(p, st.vid); });
        for (var k in st.utm) if (!u.searchParams.has(k)) u.searchParams.set(k, st.utm[k]);
        return u.toString();
      } catch (e) { return url; }
    }
  };
  window.bandit = bandit;

  function carregou() { manda('carregou'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carregou); else carregou();
  /* 1º clique em botão ou link conta como "começou" */
  document.addEventListener('click', function um(e) {
    if (e.target && e.target.closest && e.target.closest('button,a,[role=button],input[type=submit]')) {
      bandit.comecou(); document.removeEventListener('click', um, true);
    }
  }, true);
})();
