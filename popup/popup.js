document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado");
  // Now requesting updated security stats
  browser.runtime.sendMessage({ action: "getSecurityStats" }).then((response) => {
    console.log("Resposta recebida:", response);

    // Update the count of third-party connection attempts
    const thirdPartyCountElement = document.getElementById("third-party-count");
    thirdPartyCountElement.textContent = response.thirdPartyConnectionAttempts;

    // Update the count of suspicious redirects
    const suspiciousRedirectsElement = document.getElementById("suspicious-redirects");
    suspiciousRedirectsElement.textContent = response.suspiciousRedirects;

    // Update the Local Storage usage
    const localStorageUsageElement = document.getElementById("local-storage-usage");
    localStorageUsageElement.textContent = response.localStorageData;
  
    const cookieCount = document.getElementById("cookie-count");
    cookieCount.textContent = response.cookieCount;

    const canvasFingerprint = document.getElementById("canvas-fingerprint");
    canvasFingerprint.textContent = response.canvasFingerprint;

    const grade = document.getElementById("grade");
    grade.textContent = response.grade;
    
  }).catch(error => {
    console.error("Erro ao receber resposta:", error);
  });
});
