const bcrypt = require("bcrypt");
const { query } = require("../database/config");
const { parsePagination } = require("../helpers/pagination");
const { sendError, sendSuccess } = require("../helpers/response");
const { validateCreateUser } = require("../helpers/validateUser");

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

async function createUser(req, res) {
  const validation = validateCreateUser(req.body);

  if (validation.error) {
    return sendError(res, 400, validation.error);
  }

  const {
    first_name,
    last_name,
    email,
    password,
    role,
    phone,
    dob,
    gender,
    address,
  } = validation.data;

  try {
    const existing = await query('SELECT id FROM "user" WHERE email = $1', [
      email,
    ]);

    if (existing.rowCount > 0) {
      return sendError(res, 409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO "user"
        (first_name, last_name, email, password, phone, dob, gender, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, email, phone, dob, gender, address, role, created_at`,
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        phone,
        dob,
        gender,
        address,
        role,
      ],
    );

    sendSuccess(res, result.rows[0], "User created", 201);
  } catch (err) {
    console.error("createUser err:", err.message);
    sendError(res, 500, "Failed to create user");
  }
}

module.exports = { listUsers, createUser };
