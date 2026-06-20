const bcrypt = require("bcrypt");
const { query } = require("../database/config");
const { parsePagination } = require("../helpers/pagination");
const { sendError, sendSuccess } = require("../helpers/response");
const {
  validateCreateUser,
  validateUpdateUser,
} = require("../helpers/validateUser");

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

async function updateUser(req, res) {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return sendError(res, 400, "Invalid user id");
  }

  const validation = validateUpdateUser(req.body);

  if (validation.error) {
    return sendError(res, 400, validation.error);
  }

  const data = validation.data;

  try {
    const existing = await query('SELECT id FROM "user" WHERE id = $1', [
      userId,
    ]);
    // console.log(existing, "existing");

    if (existing.rowCount === 0) {
      return sendError(res, 404, "User not found");
    }

    if (data.email) {
      const emailTaken = await query(
        'SELECT id FROM "user" WHERE email = $1 AND id != $2',
        [data.email, userId],
      );

      if (emailTaken.rowCount > 0) {
        return sendError(res, 409, "Email already registered");
      }
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }

    values.push(userId);

    const result = await query(
      `UPDATE "user"
       SET ${fields.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, first_name, last_name, email, phone, dob, gender, address, role, created_at, updated_at`,
      values,
    );

    sendSuccess(res, result.rows[0], "User updated");
  } catch (err) {
    console.error("updateUser err:", err.message);
    sendError(res, 500, "Failed to update user");
  }
}

async function deleteUser(req, res) {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return sendError(res, 400, "Invalid user id");
  }

  if (userId === req.user.id) {
    return sendError(res, 400, "Cannot delete your own account");
  }

  try {
    const result = await query(
      'DELETE FROM "user" WHERE id = $1 RETURNING id, first_name, last_name, email, role',
      [userId],
    );

    if (result.rowCount === 0) {
      return sendError(res, 404, "User not found");
    }

    sendSuccess(res, result.rows[0], "User deleted");
  } catch (err) {
    console.error("deleteUser err:", err.message);
    sendError(res, 500, "Failed to delete user");
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
