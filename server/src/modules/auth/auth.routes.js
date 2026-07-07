import { Router } from "express";
import {
  sendOtp, verifyOTP, refresh, logout, register, login,
} from "./auth.controller.js";
import { otpLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/helpers.js";

const router = Router();

// All public — you can't require a token to log in
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/send-otp", otpLimiter, asyncHandler(sendOtp));  // strict limiter: SMS costs money
router.post("/verify-otp", asyncHandler(verifyOTP));
router.post("/refresh-token", refresh);
router.post("/logout", logout);

export default router;