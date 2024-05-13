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
  
    // Update the count of cookies
    const firstPartyCookieElement = document.getElementById("first-party-cookie-count");
    firstPartyCookieElement.textContent = response.firstPartyCookies;

    // Update the count of third-party cookies
    const thirdPartyCookieElement = document.getElementById("third-party-cookie-count");
    thirdPartyCookieElement.textContent = response.thirdPartyCookies;

    // Update the count of supercookies
    const supercookieElement = document.getElementById("supercookie-count");
    supercookieElement.textContent = response.superCookies;

    const canvasFingerprint = document.getElementById("canvas-fingerprint");
    canvasFingerprint.textContent = response.canvasFingerprint;

    const hook = document.getElementById("hook");
    hook.textContent = response.hook;

    const grade = document.getElementById("grade");
    grade.textContent = response.grade;

    console.log(response.thirdPartyCookies);
    
  }).catch(error => {
    console.error("Erro ao receber resposta:", error);
  });
});
