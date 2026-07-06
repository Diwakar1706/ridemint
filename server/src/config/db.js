import pg from "pg";
import config from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.db.sslEnabled
    ? { rejectUnauthorized: config.db.sslRejectUnauthorized }
    : false,
});

pool.on("connect", () => console.log(`Connected to the database (${config.db.connectionMode})`));
pool.on("error", (e) => console.error("Idle DB client error:", e)); // log, never exit

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export { pool };