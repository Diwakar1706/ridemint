import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter.js";
import auth from "./middleware/auth.js";
import errorHandler from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/helpers.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import vehicleRoutes from "./modules/vehicles/vehicles.routes.js";
import routeRoutes from "./modules/routes/routes.routes.js";
import matchingRoutes from "./modules/matching/matching.routes.js";
import ridesRoutes from "./modules/rides/rides.routes.js";
import gpsRoutes from "./modules/gps/gps.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import ratingsRoutes from "./modules/ratings/ratings.routes.js";
import safetyRoutes from "./modules/safety/safety.routes.js";
import {
  getWallet, topup, topupVerify, withdraw, getTransactions,
} from "./modules/payments/payments.controller.js";

export const app = express();

// ORDER MATTERS — middleware runs top to bottom:
app.use(helmet());                              // 1. security headers first
app.use(cors());                                // 2. allow cross-origin (tighten origin in prod!)
app.use(express.json());                        // 3. parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);                            // 4. rate limit everything below

// Health check — for uptime monitors and your own sanity
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// /api/v1 prefix = room to ship /api/v2 someday without breaking clients
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/routes", routeRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/matches", matchingRoutes);     // alias
app.use("/api/v1/rides", ridesRoutes);
app.use("/api/v1/gps", gpsRoutes);

// Wallet aliases: /wallet/* is nicer for clients than /payments/wallet
app.get("/api/v1/wallet", auth, asyncHandler(getWallet));
app.post("/api/v1/wallet/topup", auth, asyncHandler(topup));
app.post("/api/v1/wallet/topup/verify", auth, asyncHandler(topupVerify));
app.get("/api/v1/wallet/transactions", auth, asyncHandler(getTransactions));
app.post("/api/v1/wallet/withdraw", auth, asyncHandler(withdraw));

app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/ratings", ratingsRoutes);
app.use("/api/v1/safety", safetyRoutes);

// LAST: catches every error from everything above
app.use(errorHandler);
