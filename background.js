// Contagem de tentativas de conexões a domínios de terceiros
let thirdPartyConnectionAttempts = 0;
// Contagem de redirecionamentos suspeitos
let suspiciousRedirects = 0;

let localStorageUsage = 0; // Total size of all items stored in localStorage

let cookies = 0; // Total number of cookies set

let canvasFingerprintAttempts = 0;  // Counter for fingerprinting attempts

// Function to extract the domain from a URL
function getDomainFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.hostname;
}

// Function to warn the user about suspicious redirects
function notifyUser(title, message) {
  browser.notifications.create({
      "type": "basic",
      "iconUrl": browser.extension.getURL("icons/border-48.png"),
      "title": title,
      "message": message
  });
}

// Listener for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fingerprintDetected') {
      canvasFingerprintAttempts++;
      notifyUser("Tentativa de Fingerprinting Detectada", "Um script tentou extrair informações de impressão digital do seu navegador.");
  }
});

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
        notifyUser("Redirecionamento Suspeito Detectado", "O site tentou redirecionar você para outro site.");
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

// Function to count cookies for all websites
function updateCookieCount() {
  browser.cookies.getAll({}).then((cookies) => {
    console.log(`Total cookies: ${cookies.length}`);
    cookies = cookies.length; // Update the global cookie count
  }).catch((error) => {
    console.error('Error fetching cookies:', error);
  });
}

// Adding a listener to track cookie changes
browser.cookies.onChanged.addListener((changeInfo) => {
  console.log('Cookie changed:', changeInfo); // Log the change info for debugging
  updateCookieCount(); // Update the count whenever a cookie is added or removed
});

function calculateGrade(thirdPartyConnectionAttempts, suspiciousRedirects, localStorageUsage, cookies, canvasFingerprintAttempts) {
  let grade = 100; // Start from a perfect score and deduct points for security risks

  // Deduct points for third-party connection attempts
  if (thirdPartyConnectionAttempts > 20) {
      grade -= 20; // Severe penalty for very high attempts
  } else if (thirdPartyConnectionAttempts > 10) {
      grade -= 10; // Moderate penalty
  } else if (thirdPartyConnectionAttempts > 0) {
      grade -= 5; // Minor penalty
  }

  // Deduct points for suspicious redirects
  if (suspiciousRedirects > 5) {
      grade -= 25; // High impact risk
  } else if (suspiciousRedirects > 0) {
      grade -= 10;
  }

  // Deduct points for excessive localStorage usage
  if (localStorageUsage > 5) {
      grade -= 15; // Larger penalty for significant storage use
  } else if (localStorageUsage > 1) {
      grade -= 5;
  }

  // Deduct points for excessive cookies
  if (cookies > 50) {
      grade -= 20;
  } else if (cookies > 10) {
      grade -= 10;
  } else if (cookies > 0) {
      grade -= 5;
  }

  // Deduct points for canvas fingerprinting attempts
  if (canvasFingerprintAttempts > 5) {
      grade -= 30; // Very high risk of privacy invasion
  } else if (canvasFingerprintAttempts > 0) {
      grade -= 15;
  }

  // Ensure that grade does not go below 0
  return Math.max(0, grade);
}


// Listen for messages and respond with the counts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mensagem recebida:", message);
  
  if (message.action === "getSecurityStats") {
    updateLocalStorageUsage(); // Update localStorage data before sending
    updateCookieCount(); // Update the cookie count before sending
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
