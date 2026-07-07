import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../../config/env.js";

let ioInstance;

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  ioInstance = io;

  // BUG FIX: authenticate at handshake. io.use() is socket middleware —
  // runs once per connection, before any events flow. The original let
  // any socket join any user's room ("join_user") with no verification.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId; // identity from the token, not the client's claim
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Server assigns the room from the VERIFIED id — client sends nothing
    socket.join(`user:${socket.userId}`);
    console.log(`Socket connected: ${socket.id} (user ${socket.userId})`);
  });

  return io;
}

// Any module can push an event to all of a user's open tabs/devices
export function emitToUser(userId, eventName, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
}
