function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateText(value, maxLength) {
  if (value == null || value === "") return "";
  const text = String(value);
  if (!maxLength || text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  return `${text.slice(0, maxLength - 3)}...`;
}

function renderTruncated(value, maxLength) {
  const full = value == null ? "" : String(value);
  const display = truncateText(full, maxLength);
  const title =
    full.length > display.length ? ` title="${escapeHtml(full)}"` : "";
  return `<span${title}>${escapeHtml(display)}</span>`;
}
