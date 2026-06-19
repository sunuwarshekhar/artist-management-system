const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../database/config");
const { sendError, sendSuccess } = require("../helpers/response");
const { ROLES, ALL_ROLES } = require("../constants/roles");

function login(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const { email, password } = JSON.parse(body);

      if (!email || !password) {
        return sendError(res, 400, "Email and password are required");
      }
      //query with sql injection protection
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

      sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
          },
        },
        "Login successful",
      );
    } catch (err) {
      if (err instanceof SyntaxError) {
        return sendError(res, 400, "Invalid JSON");
      }
      console.error("login err:", err.message);
      sendError(res, 500, "Login failed");
    }
  });
}

function register(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
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
      } = JSON.parse(body);

      if (!first_name || !last_name || !email || !password) {
        return sendError(
          res,
          400,
          "first name, last name, email and password are required",
        );
      }

      const userRole = role || ROLES.ARTIST;
      if (!ALL_ROLES.includes(userRole)) {
        return sendError(res, 400, "Invalid role");
      }

      //query with sql injection protection
      const existing = await query('SELECT id FROM "user" WHERE email = $1', [
        email,
      ]);
      if (existing.rowCount > 0) {
        return sendError(res, 409, "Email already registered");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      //query with sql injection protection
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
          phone || null,
          dob || null,
          gender || null,
          address || null,
          userRole,
        ],
      );

      sendSuccess(res, result.rows[0], "User registered", 201);
    } catch (err) {
      if (err instanceof SyntaxError) {
        return sendError(res, 400, "Invalid JSON");
      }
      console.error("register err:", err.message);
      sendError(res, 500, "Registration failed");
    }
  });
}

module.exports = { login, register };
