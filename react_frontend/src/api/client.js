/**
 * Small fetch wrapper with:
 * - base URL via env var
 * - timeout
 * - JSON parsing + friendly error messages
 */

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * PUBLIC_INTERFACE
 * Get the configured backend base URL.
 * Falls back to same-origin if REACT_APP_API_BASE_URL is unset.
 */
export function getApiBaseUrl() {
  return (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
}

function buildUrl(path) {
  const base = getApiBaseUrl();
  // If base is empty, treat `path` as absolute-from-origin.
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function toQuery(params) {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function safeReadJson(resp) {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function extractErrorMessage(payload) {
  if (!payload) return "Request failed.";
  if (typeof payload === "string") return payload;
  if (payload.detail) return String(payload.detail);
  // DRF style: { field: ["msg"] }
  const firstKey = Object.keys(payload)[0];
  if (firstKey) {
    const v = payload[firstKey];
    if (Array.isArray(v)) return v.join(", ");
    return String(v);
  }
  return "Request failed.";
}

/**
 * PUBLIC_INTERFACE
 * Make an API request to the backend.
 * @param {string} path API path, e.g. "/api/defects/"
 * @param {object} options fetch options plus `query` and `timeoutMs`
 * @returns {Promise<any>} parsed JSON or null
 */
export async function apiRequest(path, options = {}) {
  const { query, timeoutMs, headers, ...fetchOptions } = options;
  const url = `${buildUrl(path)}${toQuery(query)}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {})
      },
      signal: controller.signal
    });

    if (resp.status === 204) return null;

    const payload = await safeReadJson(resp);
    if (!resp.ok) {
      const msg = extractErrorMessage(payload);
      const err = new Error(msg);
      err.status = resp.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  } finally {
    clearTimeout(t);
  }
}
