async function readApiErrorMessage(res, fallback) {
  const contentType = res.headers.get("Content-Type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return data.message || fallback;
    }

    const text = (await res.text()).trim();
    if (text) return text;
  } catch (error) {
    console.error("Error", error);
  }

  return `${fallback} (${res.status})`;
}

async function apiRequest(method, path, body) {
  const headers = { "Content-Type": "application/json" };

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "something went wrong"));
  }

  const data = await res.json();
  return data;
}

async function apiDownload(path, filename) {
  const headers = {};
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { headers });

  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "Download failed"));
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function apiUploadCsv(path, csvText) {
  const headers = { "Content-Type": "text/csv" };
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: csvText,
  });

  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, "Upload failed"));
  }

  return res.json();
}
