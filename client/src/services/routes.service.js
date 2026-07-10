import { api, call } from "../lib/api.js";

export const getMyRoutes = () => call(api.get("/routes/my"));
export const getRoute = (id) => call(api.get(`/routes/${id}`));
export const createRoute = (payload) => call(api.post("/routes", payload));
export const updateRoute = (id, payload) => call(api.put(`/routes/${id}`, payload));
export const deleteRoute = (id) => call(api.delete(`/routes/${id}`));
export const toggleRoute = (id) => call(api.post(`/routes/${id}/toggle`));
