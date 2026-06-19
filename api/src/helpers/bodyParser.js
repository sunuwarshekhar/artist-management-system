const { sendError } = require("./response");

function parseJsonBody(req, res, next) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      req.body = body ? JSON.parse(body) : {};
      next();
    } catch (err) {
      sendError(res, 400, "Invalid JSON");
    }
  });
}

module.exports = { parseJsonBody };
