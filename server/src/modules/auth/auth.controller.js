import jwt from "jsonwebtoken";
import config from "../../config/env.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../utils/helpers.js";
import {
  storeOtp, verifyOtp, findOrCreateUser, generateTokens, generateOtp,
  createUserWithPassword, findUserByIdentifier, verifyPassword,
} from "./auth.service.js";
import { sendOtpSms } from "./sms.service.js";

// Never send the full DB row (it contains password_hash!)
const toClientUser = (user) => ({
  id: user.id,
  phone: user.phone,
  email: user.email,
  fullName: user.full_name,
});

const register = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName?.trim()) throw new AppError("Full name is required", 400);
  if (!email?.trim()) throw new AppError("Email is required", 400);
  if (!phone?.trim()) throw new AppError("Phone is required", 400);
  if (!password || password.length < 6)
    throw new AppError("Password must be at least 6 characters", 400);

  const result = await createUserWithPassword({ fullName, email, phone, password });
  if (result.error) throw new AppError(result.error, 409); // 409 Conflict = duplicate

  const tokens = generateTokens(result.user.id);
  res.status(201).json({ success: true, ...tokens, isNewUser: true, user: toClientUser(result.user) });
};

const login = async (req, res) => {
  // Accept email OR phone in one field
  const identifier = req.body.identifier || req.body.email || req.body.phone || "";
  const { password } = req.body;

  if (!String(identifier).trim()) throw new AppError("Email or phone is required", 400);
  if (!password) throw new AppError("Password is required", 400);

  const user = await findUserByIdentifier(identifier);
  // Same message for "no such user" and "wrong password" — never
  // reveal which emails/phones are registered (prevents enumeration)
  if (!user) throw new AppError("Invalid credentials", 401);
  if (!user.password_hash)
    throw new AppError("This account is not password-enabled. Use OTP login.", 400);

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const tokens = generateTokens(user.id);
  res.json({ success: true, ...tokens, isNewUser: false, user: toClientUser(user) });
};

const sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new AppError("Enter phone number", 400);
  // Twilio needs E.164 format: +<countrycode><number>
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new AppError("Phone must be in international format, e.g. +91XXXXXXXXXX", 400);
  }
  const otp = generateOtp();
  await storeOtp(phone, otp);
  // Sends real SMS when TWILIO_* env vars are set; logs to console otherwise
  const result = await sendOtpSms(phone, otp);
  res.json({
    success: true,
    message: result.delivered ? "OTP sent via SMS" : "OTP sent successfully",
  });
};

const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  const isVerified = await verifyOtp(phone, otp);
  if (!isVerified) throw new AppError("Invalid OTP", 400);

  const { user, isNewUser } = await findOrCreateUser(phone);
  const tokens = generateTokens(user.id);
  res.json({ success: true, ...tokens, isNewUser, user: toClientUser(user) });
};

const refresh = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError("Refresh token is required", 400);
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    res.json({ success: true, ...generateTokens(decoded.userId) });
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};

const logout = (req, res) => {
  // TODO: blacklist refresh token in Redis for true server-side logout
  res.json({ success: true, message: "Logged out" });
};

export { register, login, sendOtp, verifyOTP, refresh, logout };
