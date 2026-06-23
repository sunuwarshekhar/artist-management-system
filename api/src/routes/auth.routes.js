const { login, register, getMe } = require("../controllers/auth");
const { compose } = require("../helpers/compose");
const { parseJsonBody } = require("../helpers/bodyParser");
const { authenticate } = require("../middleware/auth");
const {
  validateBody,
  validateRegister,
  validateLogin,
} = require("../validators/body.validator");

function handleAuthRoutes(req, res, method, path) {
  if (method === "POST" && path === "/api/auth/login") {
    compose(req, res, [parseJsonBody, validateBody(validateLogin), login]);
    return true;
  }

  if (method === "POST" && path === "/api/auth/register") {
    compose(req, res, [parseJsonBody, validateBody(validateRegister), register]);
    return true;
  }

  if (method === "GET" && path === "/api/auth/me") {
    compose(req, res, [authenticate, getMe]);
    return true;
  }

  return false;
}

module.exports = { handleAuthRoutes };
