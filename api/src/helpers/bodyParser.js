const { sendError } = require("./response");
const { MAX_CSV_BYTES, MAX_CSV_MB } = require("../constants/constants");

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

function parseTextBody(req, res, next) {
  let body = "";
  let totalBytes = 0;
  let rejected = false;

  req.on("data", (chunk) => {
    if (rejected) return;

    totalBytes += chunk.length;
    if (totalBytes > MAX_CSV_BYTES) {
      rejected = true;
      sendError(res, 413, `CSV file must not exceed ${MAX_CSV_MB} MB`);
      req.destroy();
      return;
    }

    body += chunk.toString();
  });

  req.on("end", () => {
    if (rejected) return;
    req.rawBody = body;
    next();
  });

  req.on("error", () => {
    if (rejected) return;
    sendError(res, 400, "Failed to read request body");
  });
}

module.exports = { parseJsonBody, parseTextBody };
