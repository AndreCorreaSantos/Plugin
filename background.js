// Contagem de tentativas de conexões a domínios de terceiros
let thirdPartyConnectionAttempts = 0;
// Contagem de redirecionamentos suspeitos
let suspiciousRedirects = 0;

let localStorageUsage = 0; // Tamanho total de todos os itens armazenados no localStorage

let cookies = 0; // Número total de cookies configurados

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

// Função para atualizar a contagem de cookies para todos os sites
function updateCookieCount() {
  let totalCookies = 0; // Inicializa a contagem total de cookies
  browser.tabs.query({}).then(tabs => {
      let promises = tabs.map(tab => {
          const tabUrl = tab.url;
          return browser.cookies.getAll({url: tabUrl}).then(cookies => {
              cookies.forEach(cookie => {
                  const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
                  if (!cookieDomain.includes(new URL(tabUrl).hostname)) {
                      totalCookies++; // Conta apenas cookies de terceira parte
                  }
              });
              return cookies.length; // Retorna a contagem total de cookies para esta aba
          });
      });

      // Aguarda a resolução de todas as promessas de contagem de cookies
      Promise.all(promises).then(results => {
          cookies = results.reduce((acc, curr) => acc + curr, 0); // Soma todas as contagens de cookies
          console.log(`Total de cookies atualizado: ${cookies}`);
      });
  }).catch(error => {
      console.error('Erro ao buscar todas as abas e cookies:', error);
  });
}

// Adicionando um listener para rastrear mudanças nos cookies
browser.cookies.onChanged.addListener((changeInfo) => {
  console.log('Cookie alterado:', changeInfo); // Registra a informação da mudança para depuração
  updateCookieCount(); // Atualiza a contagem sempre que um cookie é adicionado ou removido
});


function calculateGrade(thirdPartyConnectionAttempts, suspiciousRedirects, localStorageUsage, cookies, canvasFingerprintAttempts) {
  let grade = 100; // Começa com pontuação perfeita e deduz pontos por riscos de segurança

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
    grade -= 10;
  }

  // Deduz pontos por uso excessivo de localStorage
  if (localStorageUsage > 5) {
    grade -= 15; // Penalidade maior por uso significativo de armazenamento
  } else if (localStorageUsage > 1) {
    grade -= 5;
  }

  // Deduz pontos por excesso de cookies
  if (cookies > 50) {
    grade -= 20;
  } else if (cookies > 10) {
    grade -= 10;
  } else if (cookies > 0) {
    grade -= 5;
  }

  // Deduz pontos por tentativas de fingerprinting em canvas
  if (canvasFingerprintAttempts > 5) {
    grade -= 30; // Risco muito alto de invasão de privacidade
  } else if (canvasFingerprintAttempts > 0) {
    grade -= 15;
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
    const score = calculateGrade(thirdPartyConnectionAttempts, suspiciousRedirects, localStorageUsage, cookies, canvasFingerprintAttempts);
    sendResponse({
      thirdPartyConnectionAttempts: thirdPartyConnectionAttempts,
      suspiciousRedirects: suspiciousRedirects,
      localStorageData: localStorageUsage,
      cookieCount: cookies,
      canvasFingerprint: canvasFingerprintAttempts,
      grade: score
    });
  }
});
