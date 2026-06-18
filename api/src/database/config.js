const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkConnection() {
  const result = await pool.query("SELECT $1::text as status", [
    "DB Connection check success",
  ]);
  console.log(result.rows[0].status);
}

async function query(text, values) {
  const res = await pool.query(text, values);
  return res;
}

module.exports = { checkConnection, pool, query };
