import twilio from "twilio";
import config from "../../config/env.js";
import logger from "../../utils/logger.js";

// Twilio is used only when all three env vars are set AND valid.
// A bad config must never crash the server — worst case we fall
// back to logging the OTP to the console (dev mode).
let client = null;

const looksValid =
  config.twilio.accountSid?.startsWith("AC") &&
  Boolean(config.twilio.authToken) &&
  config.twilio.phoneNumber?.startsWith("+");

if (looksValid) {
  try {
    client = twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info("Twilio SMS enabled");
  } catch (err) {
    logger.warn(`Twilio init failed (${err.message}) — falling back to console OTP`);
  }
} else if (config.twilio.accountSid || config.twilio.authToken || config.twilio.phoneNumber) {
  logger.warn(
    "Twilio config incomplete/invalid (need TWILIO_ACCOUNT_SID starting with 'AC', " +
    "TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER starting with '+') — using console OTP",
  );
}

export const sendOtpSms = async (phone, otp) => {
  if (!client) {
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
    return { delivered: false, mode: "console" };
  }

  try {
    const message = await client.messages.create({
      from: config.twilio.phoneNumber,
      to: phone,
      body: `Your CoRide verification code is ${otp}. Valid for 5 minutes.`,
    });
    logger.info(`OTP SMS sent to ${phone} (sid: ${message.sid})`);
    return { delivered: true, mode: "sms", sid: message.sid };
  } catch (err) {
    // Twilio send failure (unverified number, no balance, etc.) —
    // log loudly but keep the OTP usable via console for dev.
    logger.error(`Twilio send failed: ${err.message}`);
    logger.info(`[FALLBACK] OTP for ${phone}: ${otp}`);
    return { delivered: false, mode: "console", error: err.message };
  }
};
