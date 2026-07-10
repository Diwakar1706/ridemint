import axios from "axios";

// All requests go through this one instance.
// baseURL: "" in dev (Vite proxy) or VITE_API_URL in production.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ""}/api/v1`,
});

// ---- token storage (single source of truth for the whole app) ----
const store = {
  get access() { return localStorage.getItem("accessToken"); },
  get refresh() { return localStorage.getItem("refreshToken"); },
  set(tokens) {
    if (tokens.accessToken) localStorage.setItem("accessToken", tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// REQUEST interceptor: attach the access token to every call
api.interceptors.request.use((config) => {
  const token = store.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE interceptor: on 401, try ONE refresh, then retry the
// original request. Concurrent 401s share the same refresh promise
// so we never fire multiple refresh calls at once.
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const is401 = error.response?.status === 401;
    const isAuthRoute = original?.url?.includes("/auth/");

    if (is401 && !original._retried && !isAuthRoute && store.refresh) {
      original._retried = true;
      try {
        refreshing ??= axios
          .post(`${import.meta.env.VITE_API_URL || ""}/api/v1/auth/refresh-token`, {
            refreshToken: store.refresh,
          })
          .finally(() => { refreshing = null; });

        const { data } = await refreshing;
        store.set(data);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original); // replay the failed request
      } catch {
        store.clear();
        window.location.href = "/login"; // refresh token dead → re-login
      }
    }
    return Promise.reject(error);
  },
);

export { api, store as tokenStore };

// Small helper: unwraps axios + returns backend error messages cleanly
export const call = async (promise) => {
  try {
    const { data } = await promise;
    return data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Request failed");
  }
};
