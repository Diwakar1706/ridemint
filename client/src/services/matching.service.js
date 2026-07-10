import { api, call } from "../lib/api.js";

export const searchMatches = (criteria) => call(api.post("/matching/search", criteria));
export const findByRoute = (routeId) => call(api.get(`/matching/find?routeId=${routeId}`));
export const getAlerts = () => call(api.get("/matching/alerts"));
export const upsertAlert = (routeId, isEnabled = true) =>
  call(api.post("/matching/alerts", { routeId, isEnabled }));
