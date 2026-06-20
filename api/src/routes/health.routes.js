const { healthCheck } = require("../controllers/health");

function handleHealthRoutes(req, res, method, path) {
  if (method === "GET" && path === "/api/health") {
    healthCheck(req, res);
    return true;
  }

  return false;
}

module.exports = { handleHealthRoutes };
