import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env relative to this file (server/.env), regardless of cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const nodeEnv = process.env.NODE_ENV || "development";
const isDev = nodeEnv === "development";

// Fail fast on missing secrets
for (const key of ["JWT_SECRET", "JWT_REFRESH_SECRET"]) {
  if (!process.env[key]) throw new Error(`Missing required env: ${key}`);
}

const parseBoolean = (v, dflt) => {
  if (v == null || v === "") return dflt;
  const n = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(n)) return true;
  if (["0", "false", "no", "off"].includes(n)) return false;
  return dflt;
};

// Dual-mode DB URL: DB_CONNECTION_MODE = local | deployed | default
const parseDbMode = (v) => {
  const n = String(v || "").trim().toLowerCase();
  return ["local", "deployed", "default"].includes(n) ? n : (isDev ? "local" : "deployed");
};
const mode = parseDbMode(process.env.DB_CONNECTION_MODE);
const databaseUrl =
  mode === "local"    ? process.env.DATABASE_URL_LOCAL    || process.env.DATABASE_URL :
  mode === "deployed" ? process.env.DATABASE_URL_DEPLOYED || process.env.DATABASE_URL :
                        process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("Missing DATABASE_URL / DATABASE_URL_DEPLOYED");

const config = {
  nodeEnv,
  isDev,
  port: process.env.PORT || 5000,
  databaseUrl,
  redisUrl: process.env.REDIS_URL,
  db: {
    connectionMode: mode,
    sslEnabled: parseBoolean(process.env.DB_SSL, !isDev),
    sslRejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  razorpay: { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
};

export default config;