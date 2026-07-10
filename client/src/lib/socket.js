import { io } from "socket.io-client";
import { tokenStore } from "./api.js";

// Singleton socket: one connection for the whole app.
// Connects only AFTER login (needs the JWT for the handshake —
// our backend's io.use() middleware rejects tokenless sockets).
let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;
  socket = io(import.meta.env.VITE_API_URL || "/", {
    auth: { token: tokenStore.access },   // matches backend socket.handler.js
    transports: ["websocket"],
  });
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
