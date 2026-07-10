import { api, call } from "../lib/api.js";

export const startTrace = (payload = {}) => call(api.post("/gps/start", payload));
export const addPoint = (payload) => call(api.post("/gps/point", payload));
export const stopTrace = (traceId) => call(api.post("/gps/stop", { traceId }));
export const getTraces = () => call(api.get("/gps/traces"));
