import { createServer } from "http";
import { app } from "./src/app.js";
import { initSocket } from "./src/modules/notifications/socket.handler.js";
import config from "./src/config/env.js";

// Why not app.listen(): Socket.IO needs the raw http.Server to attach
// its WebSocket upgrade handling. Express app + Socket.IO share one port.
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
