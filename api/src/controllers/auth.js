const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../database/config");
const { ROLES } = require("../constants/roles");
const { sendError, sendSuccess } = require("../helpers/response");

async function getArtistIdForUser(userId) {
  const artistResult = await query(
    'SELECT id FROM "artist" WHERE user_id = $1',
    [userId],
  );
  return artistResult.rowCount > 0 ? artistResult.rows[0].id : null;
}

function toAuthUser(user, artist_id = null) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    artist_id,
  };
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const result = await query(
      'SELECT id, first_name, last_name, email, password, role FROM "user" WHERE email = $1',
      [email],
    );

    if (result.rowCount === 0) {
      return sendError(res, 401, "Invalid email or password");
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return sendError(res, 401, "Password Incorrect");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    let artist_id = null;
    if (user.role === ROLES.ARTIST) {
      artist_id = await getArtistIdForUser(user.id);
    }

    sendSuccess(
      res,
      {
        token,
        user: toAuthUser(user, artist_id),
      },
      "Login successful",
    );
  } catch (err) {
    console.error("login err:", err.message);
    sendError(res, 500, "Login failed");
  }
}

async function register(req, res) {
  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    dob,
    gender,
    address,
    role,
  } = req.body;

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
       RETURNING id, first_name, last_name, email, role, created_at`,
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

    sendSuccess(res, result.rows[0], "User registered", 201);
  } catch (err) {
    console.error("register err:", err.message);
    sendError(res, 500, "Registration failed");
  }
}

async function getMe(req, res) {
  try {
    const result = await query(
      'SELECT id, first_name, last_name, email, role FROM "user" WHERE id = $1',
      [req.user.id],
    );

    if (result.rowCount === 0) {
      return sendError(res, 401, "User not found");
    }

    const user = result.rows[0];
    let artist_id = null;
    if (user.role === ROLES.ARTIST) {
      artist_id = await getArtistIdForUser(user.id);
    }

    sendSuccess(res, toAuthUser(user, artist_id), "authenticated user");
  } catch (err) {
    console.error("getMe err:", err.message);
    sendError(res, 500, "Failed to fetch user");
  }
}

module.exports = { login, register, getMe };
