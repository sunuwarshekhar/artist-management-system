require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const http = require("http");
const { checkConnection } = require("./database/config");
const { login, register } = require("./controllers/auth");
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("./controllers/users");
const { sendSuccess } = require("./helpers/response");
const { compose } = require("./helpers/compose");
const { parseJsonBody } = require("./helpers/bodyParser");
const { authenticate } = require("./middleware/auth");
const { authorizeRoles } = require("./middleware/checkPermission");
const { ROLES } = require("./constants/roles");

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname; //api/auth/login

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  //handle pre-flight req
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "GET" && url === "/api/health") {
    try {
      await checkConnection();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", database: "connected" }));
    } catch (err) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "error",
          database: "disconnected",
          message: err.message,
        }),
      );
    }
    return;
  }
  //todo: need to adapt for body parser in future
  if (method === "POST" && path === "/api/auth/login") {
    login(req, res);
    return;
  }

  if (method === "POST" && path === "/api/auth/register") {
    register(req, res);
    return;
  }

  if (method === "GET" && path === "/api/users") {
    compose(req, res, [
      authenticate,
      authorizeRoles([ROLES.ARTIST_MANAGER]),
      listUsers,
    ]);
    return;
  }

  if (method === "POST" && path === "/api/users") {
    compose(req, res, [
      authenticate,
      authorizeRoles([]),
      parseJsonBody,
      createUser,
    ]);
    return;
  }

  const userIdMatch = path.match(/^\/api\/users\/(\d+)$/);
  //regex pattern to extract id here whcih comes in 1 idx
  console.log(userIdMatch, "userIdMatch");

  if (userIdMatch) {
    req.params = { id: userIdMatch[1] };

    if (method === "PUT") {
      compose(req, res, [
        authenticate,
        authorizeRoles([]),
        parseJsonBody,
        updateUser,
      ]);
      return;
    }

    if (method === "DELETE") {
      compose(req, res, [authenticate, authorizeRoles([]), deleteUser]);
      return;
    }
  }

  if (method === "GET" && path === "/api/auth/me") {
    compose(req, res, [
      authenticate,
      (req, res) => {
        sendSuccess(res, req.user, "authenticated user");
      },
    ]);
    return;
  }

  //fallback to not found
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, message: "Route not found" }));
});

server.listen(PORT, async () => {
  console.log(`Server running at port ${PORT}`);

  try {
    await checkConnection();
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
});
