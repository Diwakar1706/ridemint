import { api, call, tokenStore } from "../lib/api.js";

export const register = (payload) => call(api.post("/auth/register", payload));
export const login = (identifier, password) =>
  call(api.post("/auth/login", { identifier, password }));
export const sendOtp = (phone) => call(api.post("/auth/send-otp", { phone }));
export const verifyOtp = (phone, otp) =>
  call(api.post("/auth/verify-otp", { phone, otp }));
export const logout = () => {
  tokenStore.clear();
  return call(api.post("/auth/logout"));
};
export const saveTokens = (data) => tokenStore.set(data);
