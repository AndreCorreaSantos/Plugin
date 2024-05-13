// Contagem de tentativas de conexões a domínios de terceiros
let thirdPartyConnectionAttempts = 0;
// Contagem de redirecionamentos suspeitos
let suspiciousRedirects = 0;

let localStorageUsage = 0; // Tamanho total de todos os itens armazenados no localStorage

let firstPartyCookies = 0; // Número total de cookies configurados
let thirdPartyCookies = 0; // Número total de cookies de terceiros
let superCookies = 0; // Número total de supercookies

let canvasFingerprintAttempts = 0;  // Contador de tentativas de fingerprinting

// Função para extrair o domínio de uma URL
function getDomainFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.hostname;
}

// Função para alertar o usuário sobre redirecionamentos suspeitos
function notifyUser(title, message) {
  browser.notifications.create({
    "type": "basic",
    "iconUrl": browser.extension.getURL("icons/border-48.png"),
    "title": title,
    "message": message
  });
}

// listener para mensagens de scripts de conteúdo
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fingerprintDetected') {
    canvasFingerprintAttempts++;
    notifyUser("Tentativa de Fingerprinting Detectada", "Um script tentou extrair informações de impressão digital do seu navegador.");
  }
});

// Listener para solicitações na web para contar conexões de terceiros e redirecionamentos suspeitos
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const requestDomain = new URL(details.url).hostname;
    const pageDomain = details.initiator || details.originUrl ? new URL(details.initiator || details.originUrl).hostname : null;

    // Detecta conexões de terceiros
    if (requestDomain !== pageDomain) {
      thirdPartyConnectionAttempts++; // Incrementa a contagem
      console.log("Tentativas de conexões de terceiros:", thirdPartyConnectionAttempts);
    }

    // Detecta redirecionamentos suspeitos
    if (details.type === "main_frame" && details.redirectUrl && !details.initiator) {
      suspiciousRedirects++; // Incrementa a contagem
      notifyUser("Redirecionamento Suspeito Detectado", "O site tentou redirecionar você para outro site.");
      console.log("Redirecionamento suspeito detectado:", suspiciousRedirects);
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Função para atualizar o uso total do localStorage
function updateLocalStorageUsage() {
  localStorageUsage = 0; // Reseta antes de calcular

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      // Estima o tamanho em bytes (assumindo que cada caractere tem 16 bits ou 2 bytes, comum para codificação UTF-16)
      localStorageUsage += (key.length + value.length) * 2;
    }
  }

  // Converte bytes para megabytes com duas casas decimais
  localStorageUsage = (localStorageUsage / 1024 / 1024).toFixed(2);

  console.log("Uso atualizado do localStorage em MB:", localStorageUsage, "MB");
}

function updateCookieCount(url, tabHostname, tabId) {
  browser.cookies.getAll({url: url}).then(cookies => {
      cookies.forEach(cookie => {
          const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
          if (cookieDomain.includes(tabHostname)) {
              firstPartyCookies++;
          } else {
              thirdPartyCookies++;
          }
      });
  });
}


// Adicionando um listener para rastrear mudanças nos cookies
browser.cookies.onChanged.addListener((changeInfo) => {
  console.log('Cookie alterado:', changeInfo); // Registra a informação da mudança para depuração
  updateCookieCount(); // Atualiza a contagem sempre que um cookie é adicionado ou removido
});


function calculateGrade(thirdPartyConnectionAttempts, suspiciousRedirects, localStorageUsage, firstPartyCookies, thirdPartyCookies, superCookies, canvasFingerprintAttempts) {
  let grade = 100; // Começa com pontuação perfeita

  // Deduz pontos por tentativas de conexões de terceiros
  if (thirdPartyConnectionAttempts > 20) {
      grade -= 20; // Penalidade severa para tentativas muito altas
  } else if (thirdPartyConnectionAttempts > 10) {
      grade -= 10; // Penalidade moderada
  } else if (thirdPartyConnectionAttempts > 0) {
      grade -= 5; // Penalidade leve
  }

  // Deduz pontos por redirecionamentos suspeitos
  if (suspiciousRedirects > 5) {
      grade -= 25; // Risco de alto impacto
  } else if (suspiciousRedirects > 0) {
      grade -= 10; // Penalidade menor para poucos redirecionamentos
  }

  // Deduz pontos por uso excessivo de localStorage
  if (localStorageUsage > 5) {
      grade -= 15; // Penalidade maior por uso significativo de armazenamento
  } else if (localStorageUsage > 1) {
      grade -= 5; // Penalidade menor por uso excessivo menor
  }

  // Deduz pontos baseado nos cookies
  if (thirdPartyCookies > 30) {
      grade -= 20; // Alta penalidade por numerosos cookies de terceiros
  } else if (thirdPartyCookies > 10) {
      grade -= 10; // Penalidade moderada
  }

  if (superCookies > 5) {
      grade -= 25; // Muito alta penalidade para supercookies
  } else if (superCookies > 0) {
      grade -= 10; // Penalidade menor
  }

  // Deduz pontos por tentativas de fingerprinting em canvas
  if (canvasFingerprintAttempts > 5) {
      grade -= 30; // Risco muito alto de invasão de privacidade
  } else if (canvasFingerprintAttempts > 0) {
      grade -= 15; // Penalidade menor
  }

  // Garante que a nota não fique abaixo de 0
  return Math.max(0, grade);
}


// Ouve mensagens e responde com as contagens
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mensagem recebida:", message);

  if (message.action === "getSecurityStats") {
    updateLocalStorageUsage(); // Atualiza os dados do localStorage antes de enviar
    updateCookieCount(); // Atualiza a contagem de cookies antes de enviar
    const score = calculateGrade(thirdPartyConnectionAttempts, suspiciousRedirects, localStorageUsage, firstPartyCookies,thirdPartyCookies,superCookies, canvasFingerprintAttempts);
    sendResponse({
      thirdPartyConnectionAttempts: thirdPartyConnectionAttempts,
      suspiciousRedirects: suspiciousRedirects,
      localStorageData: localStorageUsage,
      firstPartyCookies: firstPartyCookies,
      thirdPartyCookies: thirdPartyCookies,
      superCookies: superCookies,
      canvasFingerprint: canvasFingerprintAttempts,
      grade: score
    });
  }
});
