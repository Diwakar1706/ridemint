import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import config from "../src/config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.db.sslEnabled
    ? { rejectUnauthorized: config.db.sslRejectUnauthorized }
    : false,
});

async function migrate() {
  // 1. Tracking table: remembers which files already ran
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name  TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 2. Which files are already applied?
  const done = new Set(
    (await pool.query("SELECT file_name FROM schema_migrations")).rows
      .map((r) => r.file_name),
  );

  // 3. All .sql files, sorted — numbering controls execution order
  const dir = path.resolve(__dirname, "../migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  console.log(`Found ${files.length} migration files\n`);

  for (const file of files) {
    if (done.has(file)) {
      console.log(`SKIP  ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), "utf-8");
    try {
      await pool.query(sql);
      await pool.query(
        "INSERT INTO schema_migrations (file_name) VALUES ($1) ON CONFLICT DO NOTHING",
        [file],
      );
      console.log(`OK    ${file}`);
    } catch (err) {
      console.error(`FAIL  ${file}: ${err.message}`);
      process.exit(1); // stop — later files depend on this one
    }
  }

  console.log("\nAll migrations complete!");
  await pool.end();
}

migrate();