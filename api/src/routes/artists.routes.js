const {
  listArtists,
  listUnlinkedArtistUsers,
  createArtist,
} = require("../controllers/artists");
const { compose } = require("../helpers/compose");
const { parseJsonBody } = require("../helpers/bodyParser");
const { authenticate } = require("../middleware/auth");
const { authorizeRolesStrict } = require("../middleware/checkPermission");
const { ROLES } = require("../constants/roles");
const {
  validateBody,
  validateCreateArtist,
} = require("../validators/body.validator");
const {
  validateQuery,
  validatePagination,
  validateUnlinkedUsersSearch,
} = require("../validators/query.validator");

function handleArtistRoutes(req, res, method, path) {
  if (method === "GET" && path === "/api/artists/unlinked-users") {
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST_MANAGER]),
      validateQuery(validateUnlinkedUsersSearch, "unlinkedSearch"),
      listUnlinkedArtistUsers,
    ]);
    return true;
  }

  if (method === "GET" && path === "/api/artists") {
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.SUPER_ADMIN, ROLES.ARTIST_MANAGER]),
      validateQuery(validatePagination, "pagination"),
      listArtists,
    ]);
    return true;
  }

  if (method === "POST" && path === "/api/artists") {
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST_MANAGER]),
      parseJsonBody,
      validateBody(validateCreateArtist),
      createArtist,
    ]);
    return true;
  }

  return false;
}

module.exports = { handleArtistRoutes };
