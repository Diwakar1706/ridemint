/**
 * Singleton loader for the Mappls Web SDK.
 * Mappls has TWO script URL formats depending on which credential you have:
 *   A) key in path:      https://apis.mappls.com/advancedmaps/api/<KEY>/map_sdk?...
 *      (works with the "REST API key" from the Mappls console)
 *   B) access_token URL: https://sdk.mappls.com/map/sdk/web?access_token=<TOKEN>...
 *      (works with OAuth access tokens)
 * We try A first, then B. Readiness is POLLED because the script can
 * finish loading before window.mappls.Map is actually usable.
 */
const READY_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 150;

let mapplsPromise = null;

const getToken = () => String(import.meta.env.VITE_MAPPLS_KEY || "").trim();

const urlCandidates = (token) => [
  `https://apis.mappls.com/advancedmaps/api/${token}/map_sdk?layer=vector&v=3.0`,
  `https://sdk.mappls.com/map/sdk/web?${new URLSearchParams({
    v: "3.0",
    layer: "vector",
    access_token: token,
    domain: window.location.hostname || "localhost",
  })}`,
];

const waitForMappls = () =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      if (window.mappls && typeof window.mappls.Map === "function") {
        return resolve(window.mappls);
      }
      if (Date.now() - startedAt > READY_TIMEOUT_MS) {
        return reject(new Error("SDK loaded but never became ready"));
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
  });

const inject = (src) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.mapplsSdk = "true";
    script.src = src;
    script.onload = () => waitForMappls().then(resolve).catch(reject);
    script.onerror = () => reject(new Error(`Script failed: ${src.split("?")[0]}`));
    document.head.appendChild(script);
  });

export const loadMapplsSdk = () => {
  if (window.mappls && typeof window.mappls.Map === "function") {
    return Promise.resolve(window.mappls);
  }
  if (mapplsPromise) return mapplsPromise;

  const token = getToken();
  if (!token) return Promise.reject(new Error("Missing VITE_MAPPLS_KEY in client/.env"));

  mapplsPromise = (async () => {
    const errors = [];
    for (const url of urlCandidates(token)) {
      try {
        return await inject(url);
      } catch (err) {
        errors.push(err.message);
        document.querySelectorAll("script[data-mappls-sdk]").forEach((el) => el.remove());
      }
    }
    mapplsPromise = null; // allow retry
    throw new Error(
      `Mappls SDK failed to load (${errors.join("; ")}). ` +
      "In the Mappls console check: (1) you're using the REST API key, " +
      "(2) localhost / 127.0.0.1 is in the allowed domains for the key.",
    );
  })();

  return mapplsPromise;
};
