import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { usePolling } from "../hooks/usePolling";
import { getDashboard, listAlerts, listDefects, listActions } from "../api/qdmApi";
import { fmtDate, isOverdue, severityBadge, statusBadge } from "../utils/formatters";

function normalizeList(payload) {
  // DRF: {count, results}, others may return []
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

/**
 * PUBLIC_INTERFACE
 * Dashboard page.
 */
export default function DashboardPage() {
  const { data: dashboard, error: dashErr } = usePolling(getDashboard, [], undefined);

  const { data: defectsPayload } = usePolling(() => listDefects({ ordering: "-created_at" }), [], undefined);
  const { data: actionsPayload } = usePolling(() => listActions({ ordering: "due_date" }), [], undefined);
  const { data: alertsPayload } = usePolling(listAlerts, [], undefined);

  const defects = useMemo(() => normalizeList(defectsPayload), [defectsPayload]);
  const actions = useMemo(() => normalizeList(actionsPayload), [actionsPayload]);
  const alerts = useMemo(() => normalizeList(alertsPayload), [alertsPayload]);

  const overdueActions = actions.filter((a) =>
    isOverdue(a.due_date || a.dueDate, Boolean(a.is_closed || a.closed || a.status === "closed"))
  );

  const summary = dashboard || {};
  const totalDefects = summary.total_defects ?? summary.defects_total ?? defects.length;
  const openDefects = summary.open_defects ?? summary.defects_open ?? defects.filter((d) => String(d.status || "").toLowerCase() !== "closed").length;
  const totalActions = summary.total_actions ?? summary.actions_total ?? actions.length;

  return (
    <Layout
      title="Dashboard"
      subtitle="Overview, overdue alerts, and near-real-time activity"
      right={
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="pill">Backend: <code>{process.env.REACT_APP_API_BASE_URL || "same-origin"}</code></div>
          <Link className="btn btnPrimary" to="/defects/new">Log defect</Link>
        </div>
      }
    >
      {dashErr ? <div className="alert alertWarning">Dashboard endpoint not available yet: {dashErr}</div> : null}

      <div className="cardGrid">
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Total Defects</p>
              <p className="cardSubtitle">All time</p>
            </div>
            <span className="badge badgePrimary">Live</span>
          </div>
          <div className="kpi">{totalDefects}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Open Defects</p>
              <p className="cardSubtitle">Need triage / work</p>
            </div>
            <span className="badge badgeWarning">Attention</span>
          </div>
          <div className="kpi">{openDefects}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Corrective Actions</p>
              <p className="cardSubtitle">Tracked items</p>
            </div>
            <span className="badge badgeSuccess">CAPA</span>
          </div>
          <div className="kpi">{totalActions}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 7" }}>
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Overdue Actions</p>
              <p className="cardSubtitle">High priority follow-ups</p>
            </div>
            <Link to="/actions" className="btn">View actions</Link>
          </div>

          {overdueActions.length === 0 ? (
            <div className="alert alertSuccess">No overdue actions detected.</div>
          ) : (
            <div className="miniList">
              {overdueActions.slice(0, 5).map((a) => (
                <div className="miniItem" key={a.id || `${a.title}-${a.due_date}`}>
                  <div className="miniItemHeader">
                    <div>
                      <div className="miniItemTitle">{a.title || a.name || "Untitled action"}</div>
                      <div className="help">
                        Owner: <strong>{a.owner || a.assignee || "—"}</strong> · Due:{" "}
                        <strong>{fmtDate(a.due_date || a.dueDate)}</strong>
                      </div>
                    </div>
                    <span className="badge badgeDanger">Overdue</span>
                  </div>
                  <div className="help">
                    Defect: <code>{a.defect || a.defect_id || "—"}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ gridColumn: "span 5" }}>
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Alerts</p>
              <p className="cardSubtitle">From backend (if enabled)</p>
            </div>
            <span className="badge">Auto</span>
          </div>

          {alerts.length === 0 ? (
            <div className="alert">No alerts from backend.</div>
          ) : (
            <div className="miniList">
              {alerts.slice(0, 6).map((al) => (
                <div className="miniItem" key={al.id || `${al.type}-${al.created_at}`}>
                  <div className="miniItemHeader">
                    <div>
                      <div className="miniItemTitle">{al.title || al.type || "Alert"}</div>
                      <div className="help">{fmtDate(al.created_at || al.createdAt)}</div>
                    </div>
                    <span className={statusBadge(al.level || al.severity || al.status)}>
                      {String(al.level || al.severity || al.status || "info")}
                    </span>
                  </div>
                  <div className="help">{al.message || al.detail || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <p className="cardTitle">Recent Defects</p>
            <p className="cardSubtitle">Latest logged items</p>
          </div>
          <Link to="/defects" className="btn">Browse all</Link>
        </div>

        <div className="tableWrap">
          <table className="table" aria-label="Recent defects">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Detected</th>
              </tr>
            </thead>
            <tbody>
              {defects.slice(0, 8).map((d) => (
                <tr key={d.id || d.uuid || d.title}>
                  <td><code>{d.id ?? "—"}</code></td>
                  <td>
                    <Link className="btnLink" to={`/defects/${d.id}`}>
                      {d.title || d.summary || "Untitled defect"}
                    </Link>
                    <div className="help">{(d.description || "").slice(0, 90)}{(d.description || "").length > 90 ? "…" : ""}</div>
                  </td>
                  <td><span className={severityBadge(d.severity)}>{d.severity || "—"}</span></td>
                  <td><span className={statusBadge(d.status)}>{d.status || "—"}</span></td>
                  <td>{fmtDate(d.detected_at || d.detectedAt || d.created_at || d.createdAt)}</td>
                </tr>
              ))}
              {defects.length === 0 ? (
                <tr><td colSpan={5} className="help" style={{ padding: 14 }}>No defects yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
