import { apiRequest, getApiBaseUrl } from "./client";

/**
 * Canonical backend endpoints (Django router + function views).
 * This aligns React with the backend's `api/urls.py`.
 */
const ENDPOINTS = {
  defects: "/api/defects/",
  actions: "/api/actions/",
  rca: "/api/rca/",
  fiveWhys: "/api/five-whys/",
  alerts: "/api/alerts/",
  workflow: "/api/workflow/",
  dashboardAnalytics: "/api/analytics/dashboard/",
  alertsOverdue: "/api/alerts/overdue/",
  changesPoll: "/api/changes/poll/",
  changesSse: "/api/changes/sse/"
};

function withId(base, id) {
  // DRF DefaultRouter uses trailing slashes by default.
  return `${base}${String(id)}/`;
}

/**
 * PUBLIC_INTERFACE
 * Fetch dashboard analytics/summary.
 */
export async function getDashboard() {
  return await apiRequest(ENDPOINTS.dashboardAnalytics, { method: "GET" });
}

/**
 * PUBLIC_INTERFACE
 * List defects with optional filters.
 */
export async function listDefects(filters) {
  return await apiRequest(ENDPOINTS.defects, { method: "GET", query: filters });
}

/**
 * PUBLIC_INTERFACE
 * Create a new defect.
 */
export async function createDefect(payload) {
  return await apiRequest(ENDPOINTS.defects, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * Get defect detail.
 */
export async function getDefect(defectId) {
  return await apiRequest(withId(ENDPOINTS.defects, defectId), { method: "GET" });
}

/**
 * PUBLIC_INTERFACE
 * Update defect (PATCH).
 */
export async function patchDefect(defectId, payload) {
  return await apiRequest(withId(ENDPOINTS.defects, defectId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * Workflow transition (backend-supported action endpoint).
 */
export async function transitionDefect(defectId, payload) {
  return await apiRequest(`${withId(ENDPOINTS.defects, defectId)}transition/`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * List corrective actions, optionally by defect.
 */
export async function listActions(filters) {
  return await apiRequest(ENDPOINTS.actions, { method: "GET", query: filters });
}

/**
 * PUBLIC_INTERFACE
 * Create corrective action.
 */
export async function createAction(payload) {
  return await apiRequest(ENDPOINTS.actions, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * Patch corrective action.
 */
export async function patchAction(actionId, payload) {
  return await apiRequest(withId(ENDPOINTS.actions, actionId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * List root cause analyses, optionally by defect.
 */
export async function listRca(filters) {
  return await apiRequest(ENDPOINTS.rca, { method: "GET", query: filters });
}

/**
 * PUBLIC_INTERFACE
 * Create an RCA entry.
 */
export async function createRca(payload) {
  return await apiRequest(ENDPOINTS.rca, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * Export CSV for defects.
 * Returns a Blob.
 */
export async function exportDefectsCsv(filters) {
  const base = getApiBaseUrl();
  const path = `${ENDPOINTS.defects}export/`;
  const qs = filters ? `?${new URLSearchParams(filters).toString()}` : "";
  const full = `${base}${path}${qs}`;

  const resp = await fetch(full, { method: "GET" });
  if (!resp.ok) {
    const payload = await resp.text();
    const e = new Error(payload || "CSV export failed.");
    e.status = resp.status;
    throw e;
  }
  return await resp.blob();
}

/**
 * PUBLIC_INTERFACE
 * List alerts (CRUD endpoint).
 */
export async function listAlerts(filters) {
  return await apiRequest(ENDPOINTS.alerts, { method: "GET", query: filters });
}

/**
 * PUBLIC_INTERFACE
 * Get overdue/critical alert summary (polling-friendly).
 */
export async function getOverdueSummary() {
  return await apiRequest(ENDPOINTS.alertsOverdue, { method: "GET" });
}

/**
 * PUBLIC_INTERFACE
 * Get change cursor + changed payload (polling-friendly).
 */
export async function pollChanges(since) {
  return await apiRequest(ENDPOINTS.changesPoll, {
    method: "GET",
    query: since ? { since } : undefined
  });
}

/**
 * PUBLIC_INTERFACE
 * Build an SSE URL (the caller can use EventSource).
 */
export function getChangesSseUrl(params) {
  const base = getApiBaseUrl();
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `${base}${ENDPOINTS.changesSse}${qs}`;
}
