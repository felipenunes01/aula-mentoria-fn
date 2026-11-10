/*
 * CONFIGURAÇÃO CENTRAL DO ECOSSISTEMA FELIPE NUNES
 * Tudo que muda sem mexer nas páginas fica aqui.
 * Campo vazio ("") = ainda não definido. A página trata o vazio sem quebrar.
 */
window.FN_CONFIG = {
  marca: {
    nome: "Felipe Nunes",
    papel: "Mentor e Estrategista",
    posicionamento:
      "Transformo conhecimento em negócios digitais e formo os profissionais que fazem isso acontecer.",
    // URL da foto profissional (ex.: "/assets/felipe.webp"). Vazio = mostra o monograma FN.
    foto: "",
    instagram: "", // ex.: "https://instagram.com/seuperfil"
  },

  // WhatsApp comercial: só dígitos, com país e DDD. Ex.: "5511999998888"
  whatsapp: "",

  // Checkout do PLD (Hotmart, Kiwify, Eduzz...). Vazio = botão avisa que o checkout está em configuração.
  checkoutPLD: "",

  // Endereço do Google Apps Script que grava as candidaturas na planilha (ver site/backend/README.md).
  // Vazio = a página tenta o banco do claude.ai (só na versão de validação). Sem nenhum dos dois, o envio mostra erro e não finge sucesso.
  endpointCandidaturas: "",

  // Links legais
  politicaPrivacidade: "", // ex.: "/privacidade/"
  termosUso: "",

  // Rotas. "paths" no site real; a versão de validação troca para "hash".
  roteamento: "paths",
  rotas: {
    ecossistema: "/",
    pld: "/pld/",
    estrategistas: "/estrategistas/",
    mentores: "/mentores/",
    obrigadoEstrategistas: "/obrigado/estrategistas/",
    obrigadoMentores: "/obrigado/mentores/",
  },

  // Mensagens pré-preenchidas do WhatsApp
  mensagensWhatsApp: {
    estrategistas:
      "Olá! Concluí minha aplicação para a Mentoria de Estrategistas. Gostaria de conversar sobre os próximos passos.",
    mentores:
      "Olá! Concluí minha aplicação para a Mentoria de Mentores. Gostaria de conversar sobre a estruturação ou o crescimento da minha mentoria.",
  },

  // Mensuração: os eventos vão para window.dataLayer (GTM). Opcional: função extra.
  mensuracao: {
    debug: false,
    onEvento: null, // ex.: function (nome, dados) { fbq('trackCustom', nome, dados) }
  },
};
