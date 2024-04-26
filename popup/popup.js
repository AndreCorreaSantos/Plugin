document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado");
    browser.runtime.sendMessage({ action: "getThirdPartyAttempts" }).then((response) => {
      console.log("Resposta recebida:", response);
      const countElement = document.getElementById("third-party-count");
      countElement.textContent = response.count; // Atualiza a contagem
    });
  });
  