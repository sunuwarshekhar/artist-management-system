require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const http = require("http");
const { checkConnection } = require("./database/config");
const { mainRoutesHandler } = require("./routes");

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const routeMatched = mainRoutesHandler(req, res, method, path);
  if (routeMatched) return;
  //fallback to not found route
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
