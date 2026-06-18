require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const http = require("http");
const { checkConnection } = require("./database/config");

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

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
