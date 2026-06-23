const {
  listArtists,
  listUnlinkedArtistUsers,
  createArtist,
  getArtist,
  updateArtist,
  deleteArtist,
  getMyArtist,
  createArtistMusic,
  listArtistMusic,
} = require("../controllers/artists");
const { compose } = require("../helpers/compose");
const { parseJsonBody } = require("../helpers/bodyParser");
const { authenticate } = require("../middleware/auth");
const { authorizeRolesStrict } = require("../middleware/checkPermission");
const { ROLES } = require("../constants/roles");
const {
  validateBody,
  validateCreateArtist,
  validateUpdateArtist,
  validateCreateMusic,
} = require("../validators/body.validator");
const {
  validateParams,
  validateArtistId,
} = require("../validators/params.validator");
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

  if (method === "GET" && path === "/api/artists/me") {
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST]),
      getMyArtist,
    ]);
    return true;
  }

  const artistMusicMatch = path.match(/^\/api\/artists\/(\d+)\/music$/);

  if (artistMusicMatch && method === "GET") {
    req.params = { id: artistMusicMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([
        ROLES.SUPER_ADMIN,
        ROLES.ARTIST_MANAGER,
        ROLES.ARTIST,
      ]),
      validateParams(validateArtistId),
      validateQuery(validatePagination, "pagination"),
      listArtistMusic,
    ]);
    return true;
  }

  if (artistMusicMatch && method === "POST") {
    req.params = { id: artistMusicMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST]),
      parseJsonBody,
      validateParams(validateArtistId),
      validateBody(validateCreateMusic),
      createArtistMusic,
    ]);
    return true;
  }

  const artistIdMatch = path.match(/^\/api\/artists\/(\d+)$/);

  if (artistIdMatch && method === "GET") {
    req.params = { id: artistIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST_MANAGER]),
      validateParams(validateArtistId),
      getArtist,
    ]);
    return true;
  }

  if (artistIdMatch && method === "PUT") {
    req.params = { id: artistIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST_MANAGER]),
      parseJsonBody,
      validateParams(validateArtistId),
      validateBody(validateUpdateArtist),
      updateArtist,
    ]);
    return true;
  }

  if (artistIdMatch && method === "DELETE") {
    req.params = { id: artistIdMatch[1] };
    compose(req, res, [
      authenticate,
      authorizeRolesStrict([ROLES.ARTIST_MANAGER]),
      validateParams(validateArtistId),
      deleteArtist,
    ]);
    return true;
  }

  return false;
}

module.exports = { handleArtistRoutes };
