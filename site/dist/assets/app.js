/* Ecossistema Felipe Nunes: rotas, mensuração, CTAs, formulários de aplicação e WhatsApp. */
(function () {
  "use strict";
  var C = window.FN_CONFIG || {};

  /* ---------- utilidades ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function uid() { var t = Date.now().toString(36), r = Math.random().toString(36).slice(2, 8); return "apl-" + t + "-" + r; }
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 3400);
  }

  /* ---------- mensuração ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(nome, dados) {
    var payload = Object.assign({ event: nome }, dados || {});
    window.dataLayer.push(payload);
    try { if (typeof (C.mensuracao || {}).onEvento === "function") C.mensuracao.onEvento(nome, dados || {}); } catch (e) {}
    if ((C.mensuracao || {}).debug) console.log("[evento]", nome, dados || {});
  }

  /* ---------- origem / UTM ---------- */
  function origem() {
    var saved = store("fn_origem") || {};
    try {
      var q = new URLSearchParams(location.search), got = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(function (k) { if (q.get(k)) got[k] = q.get(k).slice(0, 200); });
      if (Object.keys(got).length) { saved = got; store("fn_origem", got); }
    } catch (e) {}
    return saved;
  }
  var ORIGEM = origem();

  /* ---------- rotas ---------- */
  var HASH = C.roteamento === "hash";
  var R = C.rotas || {};
  var hashNames = { ecossistema: "", pld: "pld", estrategistas: "estrategistas", mentores: "mentores", obrigadoEstrategistas: "obrigado-estrategistas", obrigadoMentores: "obrigado-mentores" };
  function link(nome) { return HASH ? (hashNames[nome] ? "#" + hashNames[nome] : "#inicio") : (R[nome] || "/"); }
  function go(nome) {
    if (HASH) { location.hash = hashNames[nome] || "inicio"; }
    else { location.href = R[nome] || "/"; }
  }
  $$("[data-link]").forEach(function (a) { a.setAttribute("href", link(a.getAttribute("data-link"))); });

  var pageViewEvents = { ecossistema: "visita_ecossistema", pld: "visita_pld", estrategistas: "visita_estrategistas", mentores: "visita_mentores" };
  function showPage() {
    var pages = $$("[data-page]");
    if (!pages.length) return;
    var current;
    if (pages.length === 1) current = pages[0];
    else {
      var h = (location.hash || "").replace("#", "");
      current = pages.filter(function (p) { return p.getAttribute("data-route") === h; })[0];
      if (!current) {
        var active = pages.filter(function (p) { return p.classList.contains("is-active"); })[0];
        var anchor = h && document.getElementById(h);
        if (anchor) { var owner = anchor.closest("[data-page]"); if (owner && owner === active) return; current = owner || pages[0]; }
        else current = pages[0];
      }
      if (current.classList.contains("is-active")) return;
    }
    pages.forEach(function (p) { p.classList.toggle("is-active", p === current); });
    document.body.setAttribute("data-brand", current.getAttribute("data-brand") || "");
    var name = current.getAttribute("data-page");
    if (current.getAttribute("data-title")) document.title = current.getAttribute("data-title");
    if (pageViewEvents[name]) track(pageViewEvents[name]);
    if (pages.length > 1) window.scrollTo(0, 0);
    if (current.getAttribute("data-thanks")) renderThanks(current);
  }
  if (HASH) window.addEventListener("hashchange", showPage);

  /* ---------- cliques rastreados ---------- */
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"), { programa: el.getAttribute("data-programa") || undefined, local: el.getAttribute("data-local") || undefined });
    var ck = ev.target.closest("[data-checkout]");
    if (ck) {
      track("clique_checkout_pld", { local: ck.getAttribute("data-local") || undefined });
      if (!C.checkoutPLD) { ev.preventDefault(); toast("Checkout em configuração. Volte em breve."); }
    }
    var st = ev.target.closest("[data-start-apply]");
    if (st) { ev.preventDefault(); var f = document.getElementById(st.getAttribute("data-start-apply")); if (f) { f.scrollIntoView({ behavior: "smooth", block: "start" }); var inp = $("input,button", f); setTimeout(function () { var q = $(".q:not([hidden]) input", f); if (q) q.focus({ preventScroll: true }); }, 500); } }
  });
  $$("[data-checkout]").forEach(function (a) {
    if (C.checkoutPLD) {
      var url = C.checkoutPLD;
      try { var u = new URL(url); Object.keys(ORIGEM).forEach(function (k) { if (k.indexOf("utm_") === 0 && !u.searchParams.get(k)) u.searchParams.set(k, ORIGEM[k]); }); url = u.toString(); } catch (e) {}
      a.setAttribute("href", url); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener");
    } else a.setAttribute("href", "#");
  });

  /* ---------- links legais e marca ---------- */
  $$("[data-privacy]").forEach(function (a) { if (C.politicaPrivacidade) a.setAttribute("href", C.politicaPrivacidade); else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.title = "Política de privacidade em preparação"; } });
  $$("[data-terms]").forEach(function (a) { if (C.termosUso) a.setAttribute("href", C.termosUso); else a.hidden = true; });
  $$("[data-foto]").forEach(function (box) { if ((C.marca || {}).foto) box.innerHTML = '<img src="' + C.marca.foto + '" alt="Felipe Nunes" width="76" height="76" style="width:100%;height:100%;object-fit:cover">'; });
  $$("[data-ano]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ---------- WhatsApp ---------- */
  function waUrl(programa) {
    var num = String(C.whatsapp || "").replace(/\D/g, "");
    if (!num) return "";
    var msg = (C.mensagensWhatsApp || {})[programa] || "";
    return "https://wa.me/" + num + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  function renderThanks(page) {
    var programa = page.getAttribute("data-thanks");
    var btn = $("[data-wa]", page), info = $("[data-wa-info]", page);
    var url = waUrl(programa);
    if (url) {
      btn.setAttribute("href", url); btn.setAttribute("target", "_blank"); btn.setAttribute("rel", "noopener");
      btn.onclick = function () { track("clique_whatsapp", { programa: programa }); };
      if (info) { var n = String(C.whatsapp).replace(/\D/g, ""); info.innerHTML = 'Se o WhatsApp não abrir, chame no número <code>+' + n + "</code>."; info.hidden = false; }
    } else {
      btn.removeAttribute("href");
      btn.onclick = function (e) { e.preventDefault(); toast("O número de WhatsApp ainda está em configuração."); };
      if (info) { info.textContent = "Número de WhatsApp em configuração."; info.hidden = false; }
    }
  }

  /* ---------- formulários de aplicação ---------- */
  var FORMS = {
    estrategistas: {
      origem: "Mentoria de Estrategistas",
      obrigado: "obrigadoEstrategistas",
      perguntas: [
        { id: "nome", tipo: "texto", rotulo: "Qual é o seu nome completo?", placeholder: "Seu nome completo", autocomplete: "name" },
        { id: "whatsapp", tipo: "telefone", rotulo: "Qual é o seu WhatsApp com DDD?" },
        { id: "perfil", tipo: "opcoes", rotulo: "Como você atua hoje no mercado digital?", opcoes: ["Lançador ou estrategista digital.", "Gestor de tráfego.", "Social media, copywriter ou freelancer.", "Dono de agência ou operação digital.", "Outro."] },
        { id: "faturamento", tipo: "opcoes", rotulo: "Qual é o faturamento médio mensal da sua operação ou atividade digital?", dica: "Considere o faturamento da sua atividade ou operação, não o faturamento que você administra para clientes.", opcoes: ["Ainda não faturo.", "Até R$ 5 mil.", "De R$ 5 mil a R$ 15 mil.", "De R$ 15 mil a R$ 30 mil.", "Acima de R$ 30 mil."] },
        { id: "desafio", tipo: "opcoes", rotulo: "O que mais impede você de alcançar o próximo nível hoje?", opcoes: ["Dificuldade para conquistar projetos melhores.", "Preciso melhorar ofertas, funis e conversões.", "Estou preso à execução operacional.", "Minha operação não possui processos consistentes.", "Quero aumentar faturamento, margem e escala."] },
        { id: "momento", tipo: "opcoes", rotulo: "Se a mentoria for adequada ao seu momento, quando pretende começar?", opcoes: ["O quanto antes.", "Nos próximos 30 dias.", "Nos próximos 3 meses.", "Ainda estou avaliando."] },
      ],
    },
    mentores: {
      origem: "Mentoria de Mentores",
      obrigado: "obrigadoMentores",
      perguntas: [
        { id: "nome", tipo: "texto", rotulo: "Qual é o seu nome completo?", placeholder: "Seu nome completo", autocomplete: "name" },
        { id: "whatsapp", tipo: "telefone", rotulo: "Qual é o seu WhatsApp com DDD?" },
        { id: "especialidade", tipo: "texto", rotulo: "Qual é sua área de especialidade e o conhecimento que deseja transformar em mentoria?", placeholder: "Ex.: nutrição, carreira, negócios, educação, estética, consultoria...", dica: "Nutrição, carreira, negócios, educação, estética, consultoria ou outra área.", max: 200 },
        { id: "estagio", tipo: "opcoes", rotulo: "Em que estágio está sua mentoria hoje?", opcoes: ["Tenho conhecimento, mas ainda não criei a mentoria.", "Já tenho uma ideia, mas preciso estruturar a oferta.", "Minha mentoria está pronta, mas ainda não vendo.", "Já tenho clientes, mas quero melhorar as vendas.", "Já vendo e quero estruturar a escala."] },
        { id: "objetivo", tipo: "opcoes", rotulo: "Qual é o principal resultado que você quer construir agora?", opcoes: ["Criar minha mentoria do zero.", "Estruturar uma oferta mais forte.", "Definir preço, posicionamento e proposta comercial.", "Construir um funil de aquisição e vendas.", "Escalar uma mentoria que já comercializo."] },
        { id: "prioridade", tipo: "opcoes", rotulo: "Quando pretende investir na estruturação ou no crescimento da sua mentoria?", opcoes: ["Quero começar o quanto antes.", "Nos próximos 30 dias.", "Nos próximos 3 meses.", "Estou avaliando as possibilidades."] },
      ],
    },
  };

  function maskPhone(v) {
    var d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  function phoneOk(v) {
    var d = v.replace(/\D/g, "");
    if (d.length !== 10 && d.length !== 11) return false;
    var ddd = +d.slice(0, 2); if (ddd < 11 || ddd > 99) return false;
    if (d.length === 11 && d[2] !== "9") return false;
    return true;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* Envio: 1) Apps Script (site real)  2) banco do claude.ai (versão de validação). Nunca simula sucesso. */
  var dbPromise = null;
  function getDb() {
    if (!dbPromise) dbPromise = (window.claude && typeof window.claude.use === "function") ? window.claude.use("db").catch(function () { return null; }) : Promise.resolve(null);
    return dbPromise;
  }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]); }
  function persist(rec) {
    if (C.endpointCandidaturas) {
      return withTimeout(fetch(C.endpointCandidaturas, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(rec) }), 20000)
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function (j) { if (!j || j.ok !== true) throw new Error((j && j.erro) || "recusado"); return j; });
    }
    return getDb().then(function (db) {
      if (!db) throw new Error("sem_destino");
      var tryOnce = function () { return withTimeout(db.collection("aplicacoes").doc(rec.id).set(rec), 15000); };
      return tryOnce().catch(function (e) {
        if (e && e.code === "unavailable") return new Promise(function (ok) { setTimeout(ok, 600 + Math.random() * 600); }).then(tryOnce);
        throw e;
      }).then(function () { return { ok: true, id: rec.id }; });
    });
  }

  function mountForm(root) {
    var key = root.getAttribute("data-form");
    var def = FORMS[key];
    if (!def) return;
    var draftKey = "fn_rascunho_" + key;
    var draft = store(draftKey) || {};
    var answers = draft.answers || {};
    var step = 0, total = def.perguntas.length, startedAt = 0, started = false, sending = false;

    var stepsHtml = def.perguntas.map(function (q, i) {
      var inner = "", fid = key + "-" + q.id;
      if (q.tipo === "texto") inner = '<input class="field" id="' + fid + '" name="' + q.id + '" type="text" maxlength="' + (q.max || 120) + '" placeholder="' + esc(q.placeholder || "") + '" autocomplete="' + (q.autocomplete || "off") + '" required>';
      else if (q.tipo === "telefone") inner = '<div class="phone-wrap"><span class="ddi" aria-hidden="true">🇧🇷 +55</span><input class="field" id="' + fid + '" name="' + q.id + '" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(11) 98765-4321" required></div>';
      else inner = '<div class="opts" role="radiogroup" aria-labelledby="' + fid + '-l">' + q.opcoes.map(function (o, j) {
        return '<label class="opt"><input type="radio" id="' + fid + "-" + j + '" name="' + q.id + '" value="' + esc(o) + '"><span class="dot" aria-hidden="true"></span><span>' + esc(o) + "</span></label>";
      }).join("") + "</div>";
      var last = i === total - 1 ? '<label class="consent" for="' + key + '-consent"><input type="checkbox" id="' + key + '-consent"><span>Autorizo o uso destes dados para avaliação da candidatura e contato pelo WhatsApp sobre a ' + esc(def.origem) + '. Os dados não serão vendidos nem compartilhados. <a data-privacy target="_blank" rel="noopener">Política de privacidade</a>.</span></label>' : "";
      return '<fieldset class="q" data-step="' + i + '"' + (i ? " hidden" : "") + ' style="border:0;padding:0;margin:0;min-width:0">' +
        '<legend class="q-label" id="' + fid + '-l"><label for="' + (q.tipo === "opcoes" ? fid + "-0" : fid) + '">' + esc(q.rotulo) + "</label></legend>" +
        (q.dica ? '<p class="q-hint">' + esc(q.dica) + "</p>" : "") + inner + last + '<p class="err" aria-live="polite"></p></fieldset>';
    }).join("");

    root.innerHTML =
      '<form novalidate>' +
      '<div class="form-top"><span>Pergunta <b data-n>1</b> de ' + total + '</span><span data-pct>0%</span></div>' +
      '<div class="progress" aria-hidden="true"><i></i></div>' +
      '<div class="hp" aria-hidden="true"><label>Site<input type="text" name="site" tabindex="-1" autocomplete="off"></label></div>' +
      stepsHtml +
      '<div class="form-nav"><button type="button" class="btn btn--ghost btn--sm" data-back hidden>Voltar</button><button type="submit" class="btn" data-next>Continuar</button></div>' +
      '<div class="status status--error" data-status hidden></div>' +
      "</form>";

    var form = $("form", root), nextBtn = $("[data-next]", root), backBtn = $("[data-back]", root), statusEl = $("[data-status]", root);
    $$("[data-privacy]", root).forEach(function (a) { if (C.politicaPrivacidade) a.setAttribute("href", C.politicaPrivacidade); else { a.removeAttribute("href"); } });

    // restaura rascunho
    def.perguntas.forEach(function (q) {
      var v = answers[q.id]; if (v == null) return;
      if (q.tipo === "opcoes") { $$('input[name="' + q.id + '"]', form).forEach(function (r) { r.checked = r.value === v; }); }
      else { var inp = $('[name="' + q.id + '"]', form); if (inp) inp.value = q.tipo === "telefone" ? maskPhone(v) : v; }
    });

    function save() { store(draftKey, { answers: answers }); }
    function markStart() { if (!started) { started = true; startedAt = Date.now(); track("inicio_aplicacao", { programa: def.origem }); } }

    function readStep(i) {
      var q = def.perguntas[i];
      if (q.tipo === "opcoes") { var c = $('input[name="' + q.id + '"]:checked', form); return c ? c.value : ""; }
      var v = ($('[name="' + q.id + '"]', form).value || "").trim();
      return q.tipo === "telefone" ? v.replace(/\D/g, "") : v.replace(/\s+/g, " ");
    }
    function validate(i) {
      var q = def.perguntas[i], v = readStep(i), fs = $('[data-step="' + i + '"]', form), err = $(".err", fs), msg = "";
      if (q.tipo === "texto" && q.id === "nome") { if (v.length < 3 || v.indexOf(" ") < 0) msg = "Digite seu nome completo (nome e sobrenome)."; }
      else if (q.tipo === "texto") { if (v.length < 2) msg = "Conte em poucas palavras qual é a sua área."; }
      else if (q.tipo === "telefone") { if (!phoneOk(v)) msg = "Digite um WhatsApp válido com DDD. Ex.: (11) 98765-4321."; }
      else if (!v) msg = "Escolha uma opção para continuar.";
      if (!msg && i === total - 1 && !$("#" + key + "-consent", form).checked) msg = "Marque a autorização de uso dos dados para enviar.";
      err.textContent = msg;
      var inp = $('[name="' + q.id + '"]', form);
      if (q.tipo !== "opcoes" && inp) { inp.setAttribute("aria-invalid", msg ? "true" : "false"); var w = inp.closest(".phone-wrap"); if (w) w.classList.toggle("invalid", !!msg); }
      if (!msg) { answers[q.id] = v; save(); }
      return !msg;
    }
    function render() {
      $$(".q", form).forEach(function (fs) { fs.hidden = +fs.getAttribute("data-step") !== step; });
      $("[data-n]", root).textContent = step + 1;
      var pct = Math.round((step / total) * 100);
      $("[data-pct]", root).textContent = pct + "%";
      $(".progress i", root).style.width = Math.max(pct, 4) + "%";
      backBtn.hidden = step === 0;
      nextBtn.innerHTML = step === total - 1 ? "Enviar minha aplicação" : "Continuar";
      statusEl.hidden = true;
    }
    function focusStep() { var fs = $('[data-step="' + step + '"]', form); var el = $("input:checked", fs) || $("input:not([type=checkbox])", fs); if (el) el.focus({ preventScroll: true }); }

    form.addEventListener("input", function (e) {
      markStart();
      if (e.target.type === "tel") { var pos = e.target.value; e.target.value = maskPhone(pos); }
      var fs = e.target.closest("[data-step]"); if (fs) { var er = $(".err", fs); if (er.textContent) er.textContent = ""; }
    });
    form.addEventListener("change", function (e) {
      if (e.target.type === "radio") {
        answers[e.target.name] = e.target.value; save(); markStart();
        if (step < total - 1) setTimeout(function () { if (validate(step)) { step++; render(); focusStep(); } }, 220);
      }
    });
    backBtn.addEventListener("click", function () { if (step > 0 && !sending) { step--; render(); focusStep(); } });
    statusEl.addEventListener("click", function (e) { if (e.target.closest("[data-retry]")) form.requestSubmit ? form.requestSubmit() : nextBtn.click(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      markStart();
      if (!validate(step)) { focusStep(); return; }
      if (step < total - 1) { step++; render(); focusStep(); return; }
      // honeypot / tempo mínimo
      if ($('[name="site"]', form).value) { statusEl.hidden = false; statusEl.textContent = "Não foi possível enviar. Atualize a página e tente de novo."; return; }
      sending = true; nextBtn.disabled = true; backBtn.disabled = true;
      nextBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando...';
      var rec = {
        id: (draft.id = draft.id || uid()),
        programa: key,
        origem: def.origem,
        nome: answers.nome,
        whatsapp: "55" + answers.whatsapp,
        respostas: def.perguntas.slice(2).map(function (q) { return { pergunta: q.rotulo, resposta: answers[q.id] }; }),
        criadoEm: new Date().toISOString(),
        status: "Nova aplicação",
        consentimento: true,
        campanha: ORIGEM,
        referencia: (document.referrer || "").slice(0, 300),
        pagina: location.href.slice(0, 300),
        tempoPreenchimentoSeg: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
        versaoFormulario: "1.0",
      };
      def.perguntas.slice(2).forEach(function (q) { rec[q.id] = answers[q.id]; });
      store(draftKey, { answers: answers, id: rec.id });
      persist(rec).then(function () {
        track("aplicacao_concluida", { programa: def.origem });
        store(draftKey, null);
        sending = false;
        go(def.obrigado);
      }).catch(function (err) {
        sending = false; nextBtn.disabled = false; backBtn.disabled = false; nextBtn.innerHTML = "Enviar minha aplicação";
        var semDestino = err && err.message === "sem_destino";
        statusEl.hidden = false;
        statusEl.innerHTML = semDestino
          ? "<b>O envio ainda não está conectado.</b><span>Suas respostas ficaram salvas neste aparelho. Tente de novo em alguns minutos.</span>"
          : "<b>Não conseguimos registrar sua aplicação.</b><span>Verifique sua conexão. Suas respostas continuam aqui, é só tentar de novo.</span><button type='button' class='btn btn--ghost btn--sm' data-retry>Tentar de novo</button>";
      });
    });
    render();
  }

  $$("[data-form]").forEach(mountForm);
  showPage();
})();
