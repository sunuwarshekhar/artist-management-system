const { DEFAULT_LIMIT, DEFAULT_PAGE } = require("../constants/constants");
const { query } = require("../database/config");
const { parsePagination } = require("../helpers/pagination");
const { sendError, sendSuccess } = require("../helpers/response");

async function listUsers(req, res) {
  const pagination = parsePagination(req);

  if (pagination.error) {
    return sendError(res, 400, pagination.error);
  }

  const { page, limit, offset } = pagination;

  try {
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM "user"',
    );
    const total = countResult.rows[0].total;

    const result = await query(
      `SELECT id, first_name, last_name, email, phone, dob, gender, address, role, created_at, updated_at
       FROM "user"
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    sendSuccess(
      res,
      {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      },
      "Users list fetched",
    );
  } catch (err) {
    console.error("listUsers err:", err.message);
    sendError(res, 500, "Failed to fetch users");
  }
}

module.exports = { listUsers };
