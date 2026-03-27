import { apiRequest } from "./client";

/**
 * Because the backend OpenAPI spec endpoint returned 404 in this environment,
 * the frontend implements a "multi-path" strategy:
 * try common DRF routes and accept the first that works.
 *
 * If you know exact routes, set them in one place here later.
 */

async function tryPaths(paths, options) {
  let lastErr = null;
  for (const p of paths) {
    try {
      return await apiRequest(p, options);
    } catch (e) {
      lastErr = e;
      // Continue trying other paths on 404/405; otherwise surface error.
      if (e?.status && ![404, 405].includes(e.status)) throw e;
    }
  }
  throw lastErr || new Error("No working endpoint found.");
}

function idPath(paths, id) {
  // support both /resource/:id/ and /resource/:id
  return paths.flatMap((p) => [
    `${p}${String(id)}/`,
    `${p}${String(id)}`
  ]);
}

/**
 * PUBLIC_INTERFACE
 * Fetch dashboard analytics/summary.
 */
export async function getDashboard() {
  return await tryPaths(
    ["/api/dashboard/", "/api/analytics/", "/api/metrics/", "/dashboard/"],
    { method: "GET" }
  );
}

/**
 * PUBLIC_INTERFACE
 * List defects with optional filters.
 */
export async function listDefects(filters) {
  return await tryPaths(
    ["/api/defects/", "/api/defect-logs/", "/api/quality-defects/"],
    { method: "GET", query: filters }
  );
}

/**
 * PUBLIC_INTERFACE
 * Create a new defect.
 */
export async function createDefect(payload) {
  return await tryPaths(
    ["/api/defects/", "/api/defect-logs/", "/api/quality-defects/"],
    { method: "POST", body: JSON.stringify(payload) }
  );
}

/**
 * PUBLIC_INTERFACE
 * Get defect detail.
 */
export async function getDefect(defectId) {
  const bases = ["/api/defects/", "/api/defect-logs/", "/api/quality-defects/"];
  return await tryPaths(idPath(bases, defectId), { method: "GET" });
}

/**
 * PUBLIC_INTERFACE
 * Update defect (PATCH).
 */
export async function patchDefect(defectId, payload) {
  const bases = ["/api/defects/", "/api/defect-logs/", "/api/quality-defects/"];
  return await tryPaths(idPath(bases, defectId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * Workflow transition (if supported by backend).
 */
export async function transitionDefect(defectId, payload) {
  // Try common "transition" or "status" actions.
  const candidates = [
    `/api/defects/${defectId}/transition/`,
    `/api/defects/${defectId}/workflow/`,
    `/api/defects/${defectId}/status/`,
    `/api/defects/${defectId}/set_status/`,
    `/api/defect-logs/${defectId}/transition/`
  ];
  return await tryPaths(candidates, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * List corrective actions, optionally by defect.
 */
export async function listActions(filters) {
  return await tryPaths(
    ["/api/actions/", "/api/corrective-actions/", "/api/capa-actions/"],
    { method: "GET", query: filters }
  );
}

/**
 * PUBLIC_INTERFACE
 * Create corrective action.
 */
export async function createAction(payload) {
  return await tryPaths(
    ["/api/actions/", "/api/corrective-actions/", "/api/capa-actions/"],
    { method: "POST", body: JSON.stringify(payload) }
  );
}

/**
 * PUBLIC_INTERFACE
 * Patch corrective action.
 */
export async function patchAction(actionId, payload) {
  const bases = ["/api/actions/", "/api/corrective-actions/", "/api/capa-actions/"];
  return await tryPaths(idPath(bases, actionId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

/**
 * PUBLIC_INTERFACE
 * List 5-Why root cause analyses, optionally by defect.
 */
export async function listRca(filters) {
  return await tryPaths(
    ["/api/rca/", "/api/root-causes/", "/api/why-analyses/", "/api/five-whys/"],
    { method: "GET", query: filters }
  );
}

/**
 * PUBLIC_INTERFACE
 * Create / update an RCA entry (create + patch via ID if needed).
 */
export async function createRca(payload) {
  return await tryPaths(
    ["/api/rca/", "/api/root-causes/", "/api/why-analyses/", "/api/five-whys/"],
    { method: "POST", body: JSON.stringify(payload) }
  );
}

/**
 * PUBLIC_INTERFACE
 * Export CSV for defects.
 * Returns a Blob and triggers download on the caller.
 */
export async function exportDefectsCsv(filters) {
  const candidates = [
    "/api/defects/export/",
    "/api/defects/csv/",
    "/api/export/defects/",
    "/api/defects-export/"
  ];

  // We need a variant that doesn't force JSON content-type for downloads.
  let lastErr = null;
  for (const p of candidates) {
    try {
      const url = p;
      const base = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
      const full = `${base}${url}${filters ? "?" + new URLSearchParams(filters).toString() : ""}`;
      const resp = await fetch(full, { method: "GET" });
      if (!resp.ok) {
        const payload = await resp.text();
        const e = new Error(payload || "CSV export failed.");
        e.status = resp.status;
        throw e;
      }
      return await resp.blob();
    } catch (e) {
      lastErr = e;
      if (e?.status && ![404, 405].includes(e.status)) throw e;
    }
  }
  throw lastErr || new Error("No working CSV export endpoint found.");
}

/**
 * PUBLIC_INTERFACE
 * List overdue alerts/notifications (if supported).
 */
export async function listAlerts() {
  return await tryPaths(
    ["/api/alerts/", "/api/overdue/", "/api/notifications/"],
    { method: "GET" }
  );
}
