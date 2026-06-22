const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users");
const { compose } = require("../helpers/compose");
const { parseJsonBody } = require("../helpers/bodyParser");
const { authenticate } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/checkPermission");
const {
  validateBody,
  validateCreateUser,
  validateUpdateUser,
} = require("../validators/body.validator");
const {
  validateParams,
  validateUserId,
} = require("../validators/params.validator");
const {
  validateQuery,
  validatePagination,
} = require("../validators/query.validator");

function handleUserRoutes(req, res, method, path) {
  if (method === "GET" && path === "/api/users") {
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      validateQuery(validatePagination, "pagination"),
      listUsers,
    ]);
    return true;
  }

  if (method === "POST" && path === "/api/users") {
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      parseJsonBody,
      validateBody(validateCreateUser),
      createUser,
    ]);
    return true;
  }

  const userIdMatch = path.match(/^\/api\/users\/(\d+)$/);

  if (userIdMatch && method === "GET") {
    req.params = { id: userIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      validateParams(validateUserId),
      getUser,
    ]);
    return true;
  }

  if (userIdMatch && method === "PUT") {
    req.params = { id: userIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      parseJsonBody,
      validateParams(validateUserId),
      validateBody(validateUpdateUser),
      updateUser,
    ]);
    return true;
  }

  if (userIdMatch && method === "DELETE") {
    req.params = { id: userIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      validateParams(validateUserId),
      deleteUser,
    ]);
    return true;
  }

  return false;
}

module.exports = { handleUserRoutes };
