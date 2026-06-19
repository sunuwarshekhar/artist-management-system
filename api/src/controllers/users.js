const { query } = require("../database/config");
const { sendError, sendSuccess } = require("../helpers/response");

async function listUsers(req, res) {
  try {
    const result = await query(
      `SELECT id, first_name, last_name, email, phone, dob, gender, address, role, created_at, updated_at
       FROM "user"
       ORDER BY created_at DESC`,
    );

    sendSuccess(res, result.rows, "Users fetched");
  } catch (err) {
    console.error("listUsers err:", err.message);
    sendError(res, 500, "Failed to fetch users");
  }
}

module.exports = { listUsers };
