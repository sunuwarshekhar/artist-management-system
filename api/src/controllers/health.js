const { checkConnection } = require("../database/config");

async function healthCheck(req, res) {
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
}

module.exports = { healthCheck };
