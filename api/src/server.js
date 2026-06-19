require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const http = require("http");
const { checkConnection } = require("./database/config");
const { login, register } = require("./controllers/auth");

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

  if (method === "POST" && path === "/api/auth/login") {
    login(req, res);
    return;
  }

  if (method === "POST" && path === "/api/auth/register") {
    register(req, res);
    return;
  }

  //fallback to not found
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, message: "Not found" }));
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
