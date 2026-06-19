function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, statusCode, message, errors) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors; //attaching error to payload
  sendJSON(res, statusCode, payload);
}

function sendSuccess(res, data, message, statusCode) {
  sendJSON(res, statusCode || 200, {
    success: true,
    message: message || "Success",
    data,
  });
}

module.exports = { sendJSON, sendError, sendSuccess };
