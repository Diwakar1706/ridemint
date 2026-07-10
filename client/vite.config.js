import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy: the browser talks to :5173 only; Vite forwards /api and
// /socket.io to the backend. No CORS config needed anywhere.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/socket.io": { target: "http://localhost:5000", ws: true },
    },
  },
});
