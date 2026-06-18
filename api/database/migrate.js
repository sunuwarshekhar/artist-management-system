require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const fs = require("fs");
const path = require("path");
const { pool } = require("../src/database/config");

async function migrate() {
  const sqlPath = path.join(__dirname, "migrations/tableInit.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  try {
    await pool.query(sql);
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
