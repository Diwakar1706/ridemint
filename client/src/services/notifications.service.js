import { api, call } from "../lib/api.js";

export const getNotifications = (unreadOnly = false) =>
  call(api.get(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`));
export const markRead = (id) => call(api.patch(`/notifications/${id}/read`));
export const markAllRead = () => call(api.patch("/notifications/read-all"));
