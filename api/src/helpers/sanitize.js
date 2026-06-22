function sanitizeText(value) {
  if (value == null || value === "") return null;

  return String(value).trim().replace(/[<>]/g, "");
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

module.exports = { sanitizeText, sanitizeName };
