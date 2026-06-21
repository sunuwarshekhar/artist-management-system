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
const { ROLES } = require("../constants/roles");

function handleUserRoutes(req, res, method, path) {
  if (method === "GET" && path === "/api/users") {
    compose(req, res, [authenticate, authorizeRoles([]), listUsers]);
    return true;
  }

  if (method === "POST" && path === "/api/users") {
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      parseJsonBody,
      createUser,
    ]);
    return true;
  }

  const userIdMatch = path.match(/^\/api\/users\/(\d+)$/);

  if (userIdMatch && method === "GET") {
    req.params = { id: userIdMatch[1] };
    compose(req, res, [authenticate, authorizeRoles([]), getUser]);
    return true;
  }

  if (userIdMatch && method === "PUT") {
    req.params = { id: userIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      parseJsonBody,
      updateUser,
    ]);
    return true;
  }

  if (userIdMatch && method === "DELETE") {
    req.params = { id: userIdMatch[1] };
    compose(req, res, [authenticate, authorizeRoles([]), deleteUser]);
    return true;
  }

  return false;
}

module.exports = { handleUserRoutes };
