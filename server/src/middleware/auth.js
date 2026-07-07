import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { AppError } from "../utils/helpers.js";

const auth = (req, res, next) => {
  const header = req.headers.authorization;   // "Bearer <token>"
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("No token provided", 401);
  }
  const token = header.split(" ")[1];
  try {
    // Verifies signature + expiry. Payload is { userId } (set in Phase 4).
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;   // downstream handlers read req.user.userId
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};

export default auth;