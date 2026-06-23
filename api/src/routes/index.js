const { handleAuthRoutes } = require("./auth.routes");
const { handleHealthRoutes } = require("./health.routes");
const { handleUserRoutes } = require("./users.routes");
const { handleArtistRoutes } = require("./artists.routes");

function mainRoutesHandler(req, res, method, path) {
  if (handleHealthRoutes(req, res, method, path)) return true;
  if (handleAuthRoutes(req, res, method, path)) return true;
  if (handleUserRoutes(req, res, method, path)) return true;
  if (handleArtistRoutes(req, res, method, path)) return true;
  return false;
}

module.exports = { mainRoutesHandler };
