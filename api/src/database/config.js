const pg = require("pg");

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkConnection() {
  await pool.query("SELECT 1");
}

module.exports = { checkConnection, pool };
