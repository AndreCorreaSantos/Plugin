// Contagem de tentativas de conexões a domínios de terceiros
let thirdPartyConnectionAttempts = 0;
// Contagem de redirecionamentos suspeitos
let suspiciousRedirects = 0;

let localStorageUsage = {};
// Função para extrair o domínio de uma URL
function getDomainFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.hostname;
}


// Função para avisar o usuário sobre redirecionamentos suspeitos
function notifyUserAboutRedirect() {
  browser.notifications.create({
      "type": "basic",
      "iconUrl": browser.extension.getURL("icons/border-48.png"), // Assegure-se de substituir com o caminho correto do ícone na sua extensão
      "title": "Redirecionamento Suspeito",
      "message": "Um redirecionamento suspeito foi detectado. Por favor, tenha cuidado ao seguir links externos."
  });
}

// Incrementa a contagem ao detectar uma conexão de terceiros
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const requestDomain = new URL(details.url).hostname;
      const pageDomain = details.initiator || details.originUrl ? new URL(details.initiator || details.originUrl) : null;


      // Detectar conexões de terceiros
      if (requestDomain !== pageDomain) {
        thirdPartyConnectionAttempts++; // Incrementa a contagem
        console.log("Tentativas de terceiros:", thirdPartyConnectionAttempts);
      }

      // Detectar redirecionamentos suspeitos
      if (details.type === "main_frame" && details.redirectUrl && !details.initiator) {
        suspiciousRedirects++;
        // chamar funcao para avisar usuario de redirecionamento suspeito
        notifyUserAboutRedirect();
        console.log("Redirecionamento suspeito detectado:", suspiciousRedirects); 
      }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// Verifica se a mensagem é recebida e responde com a contagem das detecções
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mensagem recebida:", message);
  
  if (message.action === "getSecurityStats") {
    sendResponse({
        thirdPartyConnectionAttempts: thirdPartyConnectionAttempts,
        suspiciousRedirects: suspiciousRedirects,
        localStorageData: localStorageUsage[message.url] // Adiciona dados de Local Storage na resposta
    });
    console.log("Estatísticas de segurança enviadas:", thirdPartyConnectionAttempts, suspiciousRedirects);
  }
});
