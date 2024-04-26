// Contagem de tentativas de conexões a domínios de terceiros
let thirdPartyConnectionAttempts = 0;
console.log('POR FAVORRRRRR');
// Função para extrair o domínio de uma URL
function getDomainFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.hostname;
}

// Incrementa a contagem ao detectar uma conexão de terceiros
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const requestDomain = new URL(details.url).hostname;
      const pageDomain = new URL(details.initiator || details.originUrl || "");
  
      if (requestDomain !== pageDomain) {
        thirdPartyConnectionAttempts++; // Incrementa a contagem
        console.log("Tentativas de terceiros:", thirdPartyConnectionAttempts);
      }
    },
    { urls: ["<all_urls>"] }
  );
  
  // Verifica se a mensagem é recebida e responde com a contagem
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Mensagem recebida:", message);
    if (message.action === "getThirdPartyAttempts") {
      sendResponse({ count: thirdPartyConnectionAttempts });
      console.log("Contagem enviada:", thirdPartyConnectionAttempts);
    }
  });
  
