function sanitizeText(value) {
  if (value == null || value === "") return null;

  return String(value).trim().replace(/[<>]/g, "");
}

const { PHONE_MAX_LENGTH } = require("../constants/constants");

function sanitizePhone(value) {
  if (value == null || value === "") return null;

  const cleaned = String(value).trim();

  if (!/^\d+$/.test(cleaned)) {
    return { error: "must contain only numbers" };
  }

  if (cleaned.length > PHONE_MAX_LENGTH) {
    return { error: `must not exceed ${PHONE_MAX_LENGTH} digits` };
  }

  return cleaned;
}

function sanitizeName(value) {
  const raw = String(value ?? "");

  if (raw.includes("<") || raw.includes(">")) {
    return { error: "contains invalid characters" };
  }

  const cleaned = sanitizeText(raw);

  if (!cleaned) return { error: "contains invalid characters" };

  if (!/^[a-zA-Z\s'-]+$/.test(cleaned)) {
    return { error: "contains invalid characters" };
  }

  return cleaned;
}

module.exports = { sanitizeText, sanitizePhone, sanitizeName };
