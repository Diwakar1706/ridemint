import { api, call } from "../lib/api.js";

export const getContacts = () => call(api.get("/safety/contacts"));
export const addContact = (payload) => call(api.post("/safety/contacts", payload));
export const deleteContact = (id) => call(api.delete(`/safety/contacts/${id}`));
export const triggerSos = (payload) => call(api.post("/safety/sos", payload));
export const resolveSos = (id) => call(api.patch(`/safety/sos/${id}/resolve`));
export const getMySosAlerts = () => call(api.get("/safety/sos"));
