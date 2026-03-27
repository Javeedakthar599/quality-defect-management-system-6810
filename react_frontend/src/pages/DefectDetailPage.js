import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { usePolling } from "../hooks/usePolling";
import { getDefect, listActions, listRca, patchDefect, transitionDefect } from "../api/qdmApi";
import { fmtDate, severityBadge, statusBadge, isOverdue } from "../utils/formatters";

function normalizeList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

/**
 * PUBLIC_INTERFACE
 * Defect detail view with workflow controls.
 */
export default function DefectDetailPage() {
  const { defectId } = useParams();
  const id = defectId;

  const { data: defect, error } = usePolling(() => getDefect(id), [id], undefined);
  const { data: actionsPayload } = usePolling(() => listActions({ defect: id }), [id], undefined);
  const { data: rcaPayload } = usePolling(() => listRca({ defect: id }), [id], undefined);

  const actions = useMemo(() => normalizeList(actionsPayload), [actionsPayload]);
  const rcaList = useMemo(() => normalizeList(rcaPayload), [rcaPayload]);

  const [editStatus, setEditStatus] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function onPatchStatus() {
    if (!editStatus) return;
    setSaveErr("");
    setSaving(true);
    try {
      await patchDefect(id, { status: editStatus });
      setEditStatus("");
    } catch (e) {
      setSaveErr(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  async function onTransition(toStatus) {
    setSaveErr("");
    setSaving(true);
    try {
      await transitionDefect(id, { to_status: toStatus, status: toStatus });
      setEditStatus("");
    } catch (e) {
      setSaveErr(e?.message || "Transition not supported by backend endpoint.");
    } finally {
      setSaving(false);
    }
  }

  const overdueCount = actions.filter((a) =>
    isOverdue(a.due_date || a.dueDate, Boolean(a.is_closed || a.closed || a.status === "closed"))
  ).length;

  return (
    <Layout
      title={`Defect #${id}`}
      subtitle="Workflow state, corrective actions, and root cause analysis"
      right={
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" to="/actions">Actions</Link>
          <Link className="btn btnPrimary" to="/rca">Add RCA</Link>
        </div>
      }
    >
      {error ? <div className="alert alertWarning">{error}</div> : null}
      {saveErr ? <div className="alert alertWarning">{saveErr}</div> : null}

      <div className="split">
        <div>
          <div className="card">
            <div className="cardHeader">
              <div>
                <p className="cardTitle">{defect?.title || defect?.summary || "Loading…"}</p>
                <p className="cardSubtitle">
                  Detected: <strong>{fmtDate(defect?.detected_at || defect?.created_at)}</strong>{" "}
                  · Owner: <strong>{defect?.owner || defect?.reported_by || "—"}</strong>
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className={severityBadge(defect?.severity)}>{defect?.severity || "—"}</span>
                <span className={statusBadge(defect?.status)}>{defect?.status || "—"}</span>
                {overdueCount > 0 ? <span className="badge badgeDanger">{overdueCount} overdue action(s)</span> : null}
              </div>
            </div>

            <div className="help" style={{ fontSize: 13 }}>
              {defect?.description || "—"}
            </div>

            <div className="hr" />

            <div className="toolbar" style={{ margin: 0 }}>
              <select
                className="select"
                style={{ maxWidth: 240 }}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                aria-label="Update status"
              >
                <option value="">Set status…</option>
                <option value="open">Open</option>
                <option value="triage">Triage</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <button className="btn btnPrimary" disabled={saving || !editStatus} onClick={onPatchStatus}>
                {saving ? "Saving…" : "Save"}
              </button>

              <span className="pill">or transition</span>

              <button className="btn" disabled={saving} onClick={() => onTransition("triage")}>→ Triage</button>
              <button className="btn" disabled={saving} onClick={() => onTransition("in_progress")}>→ In progress</button>
              <button className="btn" disabled={saving} onClick={() => onTransition("resolved")}>→ Resolved</button>
              <button className="btn" disabled={saving} onClick={() => onTransition("closed")}>→ Closed</button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardHeader">
              <div>
                <p className="cardTitle">Corrective Actions</p>
                <p className="cardSubtitle">Track tasks to eliminate recurrence</p>
              </div>
              <Link to="/actions" className="btn">Manage</Link>
            </div>

            {actions.length === 0 ? (
              <div className="alert">No actions found for this defect.</div>
            ) : (
              <div className="tableWrap" style={{ boxShadow: "none" }}>
                <table className="table" aria-label="Corrective actions table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Owner</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((a) => {
                      const closed = Boolean(a.is_closed || a.closed || String(a.status || "").toLowerCase() === "closed");
                      const overdue = isOverdue(a.due_date || a.dueDate, closed);
                      return (
                        <tr key={a.id || a.title}>
                          <td>
                            {a.title || a.name || "Untitled action"}
                            {overdue ? <div className="help"><span className="badge badgeDanger">Overdue</span></div> : null}
                          </td>
                          <td>{a.owner || a.assignee || "—"}</td>
                          <td>{fmtDate(a.due_date || a.dueDate)}</td>
                          <td><span className={statusBadge(a.status || (closed ? "closed" : "open"))}>{a.status || (closed ? "closed" : "open")}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="cardHeader">
              <div>
                <p className="cardTitle">Root Cause Analysis (5-Why)</p>
                <p className="cardSubtitle">Identify the underlying cause</p>
              </div>
              <Link to="/rca" className="btn btnPrimary">Add / Edit</Link>
            </div>

            {rcaList.length === 0 ? (
              <div className="alert">No RCA captured yet.</div>
            ) : (
              <div className="miniList">
                {rcaList.slice(0, 3).map((r) => (
                  <div key={r.id || r.root_cause} className="miniItem">
                    <div className="miniItemHeader">
                      <div>
                        <div className="miniItemTitle">{r.root_cause || r.summary || "RCA"}</div>
                        <div className="help">{fmtDate(r.created_at || r.createdAt)}</div>
                      </div>
                      <span className="badge badgePrimary">{(r.whys && r.whys.length) ? `${r.whys.length} whys` : "RCA"}</span>
                    </div>
                    {Array.isArray(r.whys) ? (
                      <ol className="help" style={{ margin: "0 0 0 18px" }}>
                        {r.whys.slice(0, 5).map((w, idx) => <li key={idx}>{w}</li>)}
                      </ol>
                    ) : (
                      <div className="help">{r.details || "—"}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="hr" />
            <div className="help">
              Tip: Aim for 5 levels of "why" and ensure actions address the root cause, not symptoms.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
