import { api, call } from "../lib/api.js";

export const getWallet = () => call(api.get("/wallet"));
export const topup = (amount) => call(api.post("/wallet/topup", { amount }));
export const withdraw = (amount) => call(api.post("/wallet/withdraw", { amount }));
export const getTransactions = () => call(api.get("/wallet/transactions"));
export const payForRide = (rideId, payload = {}) =>
  call(api.post(`/payments/rides/${rideId}/pay`, payload));
