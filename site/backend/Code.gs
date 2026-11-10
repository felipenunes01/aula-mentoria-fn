/**
 * Backend das candidaturas do Ecossistema Felipe Nunes (Google Apps Script + Google Sheets).
 * Grava cada aplicação na aba do programa e só responde ok:true depois da gravação.
 * Instalação: ver site/backend/README.md.
 */
var ABAS = { estrategistas: "Estrategistas", mentores: "Mentores" };
var ORIGENS = { estrategistas: "Mentoria de Estrategistas", mentores: "Mentoria de Mentores" };
var CAMPOS = {
  estrategistas: ["perfil", "faturamento", "desafio", "momento"],
  mentores: ["especialidade", "estagio", "objetivo", "prioridade"],
};
var CABECALHO_BASE = ["ID", "Data e hora", "Programa", "Nome", "WhatsApp"];
var CABECALHO_FIM = ["Status", "UTM source", "UTM medium", "UTM campaign", "UTM content", "UTM term", "Página", "Referência", "Tempo (s)", "Consentimento"];

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var erro = validar(d);
    if (erro) return json({ ok: false, erro: erro });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var cache = CacheService.getScriptCache();
      var chave = "tel_" + d.programa + "_" + d.whatsapp;
      if (cache.get(chave)) return json({ ok: true, id: cache.get(chave), duplicado: true });

      var aba = obterAba(d.programa);
      var c = d.campanha || {};
      var linha = [String(d.id).slice(0, 60), new Date(), ORIGENS[d.programa], limpar(d.nome, 120), "+" + d.whatsapp]
        .concat(CAMPOS[d.programa].map(function (k) { return limpar(d[k], 300); }))
        .concat(["Nova aplicação", limpar(c.utm_source), limpar(c.utm_medium), limpar(c.utm_campaign), limpar(c.utm_content), limpar(c.utm_term), limpar(d.pagina, 300), limpar(d.referencia, 300), Number(d.tempoPreenchimentoSeg) || "", "Sim"]);
      aba.appendRow(linha);
      SpreadsheetApp.flush();
      cache.put(chave, String(d.id), 120);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true, id: d.id });
  } catch (err) {
    return json({ ok: false, erro: "falha_interna" });
  }
}

function validar(d) {
  if (!ABAS[d.programa]) return "programa_invalido";
  if (d.site) return "spam";
  if (!d.consentimento) return "sem_consentimento";
  var nome = String(d.nome || "").trim();
  if (nome.length < 3 || nome.length > 120 || nome.indexOf(" ") < 0) return "nome_invalido";
  var tel = String(d.whatsapp || "").replace(/\D/g, "");
  if (!/^55\d{10,11}$/.test(tel)) return "whatsapp_invalido";
  d.whatsapp = tel;
  if (Number(d.tempoPreenchimentoSeg) > 0 && Number(d.tempoPreenchimentoSeg) < 4) return "spam";
  var faltando = CAMPOS[d.programa].filter(function (k) { return !String(d[k] || "").trim(); });
  if (faltando.length) return "respostas_incompletas";
  return "";
}

function obterAba(programa) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nome = ABAS[programa];
  var aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    var titulos = { perfil: "Atuação", faturamento: "Faturamento mensal", desafio: "Desafio principal", momento: "Quando começar", especialidade: "Especialidade", estagio: "Estágio da mentoria", objetivo: "Resultado desejado", prioridade: "Quando investir" };
    var cab = CABECALHO_BASE.concat(CAMPOS[programa].map(function (k) { return titulos[k]; })).concat(CABECALHO_FIM);
    aba.appendRow(cab);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, cab.length).setFontWeight("bold");
  }
  return aba;
}

function limpar(v, max) {
  var s = String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s; // evita injeção de fórmula na planilha
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json({ ok: true, servico: "candidaturas" });
}
