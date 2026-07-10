import { api, call } from "../lib/api.js";

export const getMe = () => call(api.get("/users/me"));
export const updateMe = (payload) => call(api.put("/users/me", payload));
export const updateLocations = (payload) => call(api.put("/users/me/locations", payload));
export const getPublicProfile = (id) => call(api.get(`/users/${id}/public`));
