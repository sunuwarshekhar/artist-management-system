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

function sendCsv(res, filename, csvText) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
  res.end(csvText);
}

module.exports = { sendJSON, sendError, sendSuccess, sendCsv };
