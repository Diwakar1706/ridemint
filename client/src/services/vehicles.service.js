import { api, call } from "../lib/api.js";

export const getMyVehicles = () => call(api.get("/vehicles"));
export const addVehicle = (payload) => call(api.post("/vehicles", payload));
export const updateVehicle = (id, payload) => call(api.put(`/vehicles/${id}`, payload));
export const deleteVehicle = (id) => call(api.delete(`/vehicles/${id}`));
