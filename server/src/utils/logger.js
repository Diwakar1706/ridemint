import { createLogger, format, transports } from "winston";
import config from "../config/env.js";

const logger = createLogger({
  level: config.isDev ? "debug" : "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),   // log full stack traces from Error objects
    format.json(),
  ),
  defaultMeta: { service: "coride-api" },
  transports: [
    new transports.Console({
      format: config.isDev
        ? format.combine(format.colorize(), format.simple())  // human-readable in dev
        : format.json(),  // machine-parseable JSON in prod (for log aggregators)
    }),
  ],
});

export default logger;