const jwt = require("jsonwebtoken");
const { sendError } = require("../helpers/response");

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return sendError(res, 401, "Authorization token is required");
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, 401, "Token is expired");
    }
    return sendError(res, 401, "Invalid token");
  }
}

module.exports = { authenticate };
