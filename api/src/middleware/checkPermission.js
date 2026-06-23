const { sendError } = require("../helpers/response");
const { ROLES } = require("../constants/roles");

function authorizeRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "No Permission");
    }

    return next();
  };
}

function authorizeRolesStrict(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "No Permission");
    }

    return next();
  };
}

module.exports = { authorizeRoles, authorizeRolesStrict };
