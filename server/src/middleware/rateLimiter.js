import rateLimit from "express-rate-limit";

const parsePositiveInt = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const isProduction = process.env.NODE_ENV === "production";

const common = {
  standardHeaders: "draft-8",   // send RateLimit headers so clients can back off
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",  // don't throttle test suites
};

// General API limiter: generous, catches abuse/runaway loops
export const apiLimiter = rateLimit({
  ...common,
  windowMs: parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 60_000),
  max: parsePositiveInt(process.env.API_RATE_LIMIT_MAX, isProduction ? 100 : 500),
  message: { success: false, message: "Too many requests, try later" },
});

// OTP limiter: strict — SMS costs money and OTP spam enables abuse
const otpWindowMs = parsePositiveInt(process.env.OTP_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000);
export const otpLimiter = rateLimit({
  ...common,
  windowMs: otpWindowMs,
  max: parsePositiveInt(process.env.OTP_RATE_LIMIT_MAX, isProduction ? 5 : 20),
  handler: (req, res) => {
    const reset = req.rateLimit?.resetTime
      ? new Date(req.rateLimit.resetTime).getTime()
      : Date.now() + otpWindowMs;
    const waitSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    res.status(429).json({
      success: false,
      message: `Too many OTP requests. Try again in ${waitSeconds}s`,
      retryAfterSeconds: waitSeconds,
    });
  },
});