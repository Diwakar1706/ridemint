import { api, call } from "../lib/api.js";

export const createRating = (payload) => call(api.post("/ratings", payload));
export const getReceived = () => call(api.get("/ratings/received"));
export const getGiven = () => call(api.get("/ratings/given"));
