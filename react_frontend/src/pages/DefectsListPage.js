import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { usePolling } from "../hooks/usePolling";
import { exportDefectsCsv, listDefects } from "../api/qdmApi";
import { fmtDate, severityBadge, statusBadge } from "../utils/formatters";

function normalizeList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * PUBLIC_INTERFACE
 * Defects list page with filtering and export.
 */
export default function DefectsListPage() {
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    severity: ""
  });

  const { data, error, isLoading } = usePolling(
    () =>
      listDefects({
        search: filters.q || undefined,
        q: filters.q || undefined,
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        ordering: "-created_at"
      }),
    [filters.q, filters.status, filters.severity],
    undefined
  );

  const defects = useMemo(() => normalizeList(data), [data]);
  const [exportErr, setExportErr] = useState("");

  async function onExport() {
    setExportErr("");
    try {
      const blob = await exportDefectsCsv({
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        q: filters.q || undefined
      });
      downloadBlob(blob, `defects_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      setExportErr(e?.message || "Export failed.");
    }
  }

  return (
    <Layout
      title="Defects"
      subtitle="Log review, workflow tracking, and CSV export"
      right={
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={onExport}>Export CSV</button>
          <Link className="btn btnPrimary" to="/defects/new">New defect</Link>
        </div>
      }
    >
      {exportErr ? <div className="alert alertWarning">{exportErr}</div> : null}
      {error ? <div className="alert alertWarning">{error}</div> : null}

      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 360 }}
          placeholder="Search title/description…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          aria-label="Search defects"
        />
        <select
          className="select"
          style={{ maxWidth: 220 }}
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="triage">Triage</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          className="select"
          style={{ maxWidth: 220 }}
          value={filters.severity}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <span className="pill">{isLoading ? "Refreshing…" : `${defects.length} items`}</span>
      </div>

      <div className="tableWrap">
        <table className="table" aria-label="Defects table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Detected</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((d) => (
              <tr key={d.id || d.uuid || d.title}>
                <td><code>{d.id ?? "—"}</code></td>
                <td>
                  <Link className="btnLink" to={`/defects/${d.id}`}>
                    {d.title || d.summary || "Untitled defect"}
                  </Link>
                  <div className="help">
                    {(d.description || "").slice(0, 110)}
                    {(d.description || "").length > 110 ? "…" : ""}
                  </div>
                </td>
                <td><span className={severityBadge(d.severity)}>{d.severity || "—"}</span></td>
                <td><span className={statusBadge(d.status)}>{d.status || "—"}</span></td>
                <td>{fmtDate(d.detected_at || d.detectedAt || d.created_at || d.createdAt)}</td>
                <td>{d.owner || d.reported_by || d.assignee || "—"}</td>
              </tr>
            ))}
            {defects.length === 0 ? (
              <tr><td colSpan={6} className="help" style={{ padding: 14 }}>No defects match the current filters.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
