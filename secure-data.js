(() => {
  const GRAPH_SCOPE = "Files.Read";

  function base64UrlEncodeUtf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function shareIdFromUrl(url) {
    return "u!" + base64UrlEncodeUtf8(url);
  }

  function assertConfig() {
    const cfg = window.SECURE_DATA_CONFIG || {};
    const missing = [];
    ["tenantId", "clientId", "estrellaShareUrl", "tresNinasShareUrl"].forEach(k => {
      if (!cfg[k]) missing.push(k);
    });
    if (missing.length) {
      throw new Error("Configuración segura incompleta: " + missing.join(", "));
    }
    return cfg;
  }

  let msalApp;

  async function getToken() {
    const cfg = assertConfig();

    if (!window.msal) {
      throw new Error("No se cargó Microsoft Authentication Library (MSAL).");
    }

    if (!msalApp) {
      msalApp = new msal.PublicClientApplication({
        auth: {
          clientId: cfg.clientId,
          authority: "https://login.microsoftonline.com/" + cfg.tenantId,
          redirectUri: window.location.origin + window.location.pathname
        },
        cache: {
          cacheLocation: "sessionStorage"
        }
      });
      await msalApp.initialize();
    }

    let account = msalApp.getAllAccounts()[0];

    if (!account) {
      const login = await msalApp.loginPopup({ scopes: [GRAPH_SCOPE] });
      account = login.account;
    }

    try {
      const token = await msalApp.acquireTokenSilent({
        account,
        scopes: [GRAPH_SCOPE]
      });
      return token.accessToken;
    } catch {
      const token = await msalApp.acquireTokenPopup({
        account,
        scopes: [GRAPH_SCOPE]
      });
      return token.accessToken;
    }
  }

  async function fetchSharedJson(shareUrl) {
    const token = await getToken();
    const shareId = shareIdFromUrl(shareUrl);
    const endpoint = "https://graph.microsoft.com/v1.0/shares/" + shareId + "/driveItem/content";

    const response = await fetch(endpoint, {
      headers: {
        Authorization: "Bearer " + token
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error("No se pudo cargar el JSON seguro (" + response.status + "): " + detail);
    }

    return response.json();
  }

  window.secureData = {
    async load(kind) {
      const cfg = assertConfig();

      if (kind === "estrella") {
        return fetchSharedJson(cfg.estrellaShareUrl);
      }

      if (kind === "tres-ninas") {
        return fetchSharedJson(cfg.tresNinasShareUrl);
      }

      throw new Error("Fuente de datos segura desconocida: " + kind);
    }
  };
})();
