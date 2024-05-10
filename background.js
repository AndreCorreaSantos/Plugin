// Contagem de tentativas de conexões a domínios de terceiros
let thirdPartyConnectionAttempts = 0;
// Contagem de redirecionamentos suspeitos
let suspiciousRedirects = 0;

let localStorageUsage = 0; // Total size of all items stored in localStorage

// Function to extract the domain from a URL
function getDomainFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.hostname;
}

// Function to warn the user about suspicious redirects
function notifyUserAboutRedirect() {
  browser.notifications.create({
      "type": "basic",
      "iconUrl": browser.extension.getURL("icons/border-48.png"),
      "title": "Redirecionamento Suspeito",
      "message": "Um redirecionamento suspeito foi detectado. Por favor, tenha cuidado ao seguir links externos."
  });
}

// Listener for web requests to count third-party connections and suspicious redirects
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const requestDomain = new URL(details.url).hostname;
      const pageDomain = details.initiator || details.originUrl ? new URL(details.initiator || details.originUrl).hostname : null;

      // Detect third-party connections
      if (requestDomain !== pageDomain) {
        thirdPartyConnectionAttempts++; // Increment count
        console.log("Tentativas de terceiros:", thirdPartyConnectionAttempts);
      }

      // Detect suspicious redirects
      if (details.type === "main_frame" && details.redirectUrl && !details.initiator) {
        suspiciousRedirects++; // Increment count
        notifyUserAboutRedirect(); // Notify user about the suspicious redirect
        console.log("Redirecionamento suspeito detectado:", suspiciousRedirects); 
      }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// Function to update the total usage of localStorage
function updateLocalStorageUsage() {
  localStorageUsage = 0; // Reset before calculating

  for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
          const value = localStorage.getItem(key);
          // Estimate the size in bytes (assuming each character is 16 bits or 2 bytes, which is common for UTF-16 encoding)
          localStorageUsage += (key.length + value.length) * 2;
      }
  }

  // Convert bytes to megabytes with two decimal places
  localStorageUsage = (localStorageUsage / 1024 / 1024).toFixed(2);

  console.log("Atualização do uso do localStorage em MB:", localStorageUsage, "MB");
}


// Listen for messages and respond with the counts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mensagem recebida:", message);
  
  if (message.action === "getSecurityStats") {
    updateLocalStorageUsage(); // Update localStorage data before sending
    sendResponse({
        thirdPartyConnectionAttempts: thirdPartyConnectionAttempts,
        suspiciousRedirects: suspiciousRedirects,
        localStorageData: localStorageUsage // Include localStorage usage in the response
    });
    console.log("Estatísticas de segurança enviadas:", thirdPartyConnectionAttempts, suspiciousRedirects, localStorageUsage);
  }
});
