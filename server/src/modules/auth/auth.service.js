import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../../config/env.js";
import { query, getClient } from "../../config/db.js";
import redis from "../../config/redis.js";

// ---------- OTP ----------

// 6-digit code: 100000–999999
const generateOtp = () =>
  Math.floor(Math.random() * 900000 + 100000).toString();

// BUG FIX #3: OTPs live in Redis when available (survives restarts,
// works across multiple server instances). Map is the dev fallback.
const otpMap = new Map();
const OTP_TTL_SECONDS = 5 * 60;

const storeOtp = async (phone, otp) => {
  if (redis) {
    await redis.set(`otp:${phone}`, otp, "EX", OTP_TTL_SECONDS); // auto-expires
    return;
  }
  otpMap.set(phone, otp);
  setTimeout(() => otpMap.delete(phone), OTP_TTL_SECONDS * 1000);
};

const verifyOtp = async (phone, otp) => {
  const stored = redis ? await redis.get(`otp:${phone}`) : otpMap.get(phone);
  if (stored && stored === otp) {
    // Single-use: delete immediately so it can't be replayed
    if (redis) await redis.del(`otp:${phone}`);
    else otpMap.delete(phone);
    return true;
  }
  return false;
};

// ---------- Tokens ----------

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,          // 15m — short life limits stolen-token damage
  }),
  refreshToken: jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,   // 7d — different secret on purpose
  }),
});

// ---------- Users ----------

const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
const normalizePhone = (p) => String(p || "").trim();

// Creates user + wallet ATOMICALLY (bug fix #2): same client,
// BEGIN/COMMIT — either both rows exist or neither does.
const createUserWithPassword = async ({ fullName, email, phone, password }) => {
  const client = await getClient();
  try {
    // cost 12 ≈ 4096 hash rounds — slow by design, so leaked hashes
    // can't be brute-forced quickly
    const passwordHash = await bcrypt.hash(password, 12);

    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO users (phone, email, full_name, password_hash,
                          is_phone_verified, is_email_verified)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING *`,
      [normalizePhone(phone), normalizeEmail(email), String(fullName).trim(), passwordHash],
    );
    await client.query("INSERT INTO wallets (user_id) VALUES ($1)", [
      inserted.rows[0].id,
    ]);
    await client.query("COMMIT");
    return { user: inserted.rows[0], isNewUser: true };
  } catch (err) {
    await client.query("ROLLBACK");
    // 23505 = unique_violation: DB constraint is the real duplicate
    // check (bug fix #1 — no check-then-insert race)
    if (err.code === "23505") {
      const field = /email/i.test(err.detail || "") ? "Email" : "Phone";
      return { error: `${field} already registered` };
    }
    throw err;
  } finally {
    client.release(); // ALWAYS return the connection to the pool
  }
};

const findUserByIdentifier = async (identifier) => {
  const normalized = String(identifier || "").trim();
  const result = await query(
    `SELECT id, phone, email, full_name, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1) OR phone = $1
     LIMIT 1`,
    [normalized],
  );
  return result.rows[0] || null;
};

const verifyPassword = (password, passwordHash) =>
  passwordHash ? bcrypt.compare(password, passwordHash) : false;

// OTP flow: user may not exist yet — create on first login
const findOrCreateUser = async (phone) => {
  const existing = await query("SELECT * FROM users WHERE phone = $1", [phone]);
  if (existing.rows.length > 0)
    return { user: existing.rows[0], isNewUser: false };

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const created = await client.query(
      `INSERT INTO users (phone, full_name, is_phone_verified)
       VALUES ($1, $2, true) RETURNING *`,
      [phone, `User${phone.slice(-4)}`], // placeholder name until profile setup
    );
    await client.query("INSERT INTO wallets (user_id) VALUES ($1)", [
      created.rows[0].id,
    ]);
    await client.query("COMMIT");
    return { user: created.rows[0], isNewUser: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export {
  generateOtp, storeOtp, verifyOtp, generateTokens,
  findOrCreateUser, createUserWithPassword, findUserByIdentifier, verifyPassword,
};