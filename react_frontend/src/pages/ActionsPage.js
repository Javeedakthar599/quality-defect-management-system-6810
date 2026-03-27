import React, { useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { usePolling } from "../hooks/usePolling";
import { createAction, listActions, listDefects, patchAction } from "../api/qdmApi";
import { fmtDate, isOverdue, statusBadge } from "../utils/formatters";
import { validateAction } from "../utils/validators";

function normalizeList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

/**
 * PUBLIC_INTERFACE
 * Corrective actions list + create page.
 */
export default function ActionsPage() {
  const { data: defectsPayload } = usePolling(() => listDefects({ ordering: "-created_at" }), [], undefined);
  const defects = useMemo(() => normalizeList(defectsPayload), [defectsPayload]);

  const { data: actionsPayload, error } = usePolling(() => listActions({ ordering: "due_date" }), [], undefined);
  const actions = useMemo(() => normalizeList(actionsPayload), [actionsPayload]);

  const [values, setValues] = useState({
    defect: "",
    title: "",
    owner: "",
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "open"
  });
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitErr("");

    const v = validateAction(values);
    setErrors(v.errors);
    if (!v.valid) return;

    setIsSubmitting(true);
    try {
      await createAction(values);
      setValues((prev) => ({ ...prev, title: "" }));
    } catch (e2) {
      setSubmitErr(e2?.message || "Failed to create action.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onToggleClosed(a) {
    const closed = Boolean(a.is_closed || a.closed || String(a.status || "").toLowerCase() === "closed");
    try {
      await patchAction(a.id, { status: closed ? "open" : "closed", is_closed: !closed, closed: !closed });
    } catch (e) {
      // keep silent in demo; surfaced by polling refresh error on next tick if persistent
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  return (
    <Layout
      title="Corrective Actions"
      subtitle="Track CAPA items, due dates, and overdue alerts"
      right={<span className="badge badgeDanger">{actions.filter((a) => isOverdue(a.due_date, Boolean(a.is_closed || a.closed || a.status === "closed"))).length} overdue</span>}
    >
      {error ? <div className="alert alertWarning">{error}</div> : null}
      {submitErr ? <div className="alert alertDanger">{submitErr}</div> : null}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardHeader">
          <div>
            <p className="cardTitle">Create Action</p>
            <p className="cardSubtitle">Assign owner and due date</p>
          </div>
          <span className="badge badgeSuccess">CAPA</span>
        </div>

        <form onSubmit={onSubmit}>
          <div className="fieldRow">
            <div className="field">
              <label className="label" htmlFor="defect">Defect</label>
              <select
                id="defect"
                className="select"
                value={values.defect}
                onChange={(e) => setValues((v) => ({ ...v, defect: e.target.value }))}
              >
                <option value="">Select defect…</option>
                {defects.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.id} — {d.title || d.summary || "Untitled"}
                  </option>
                ))}
              </select>
              {errors.defect ? <div className="errorText">{errors.defect}</div> : null}
            </div>

            <div className="field">
              <label className="label" htmlFor="due_date">Due date</label>
              <input
                id="due_date"
                className="input"
                type="date"
                value={values.due_date}
                onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
              />
              {errors.due_date ? <div className="errorText">{errors.due_date}</div> : null}
            </div>

            <div className="field fieldFull">
              <label className="label" htmlFor="title">Title</label>
              <input
                id="title"
                className="input"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                placeholder="e.g., Update inspection SOP and retrain operators"
              />
              {errors.title ? <div className="errorText">{errors.title}</div> : null}
            </div>

            <div className="field">
              <label className="label" htmlFor="owner">Owner</label>
              <input
                id="owner"
                className="input"
                value={values.owner}
                onChange={(e) => setValues((v) => ({ ...v, owner: e.target.value }))}
                placeholder="Name / role"
              />
              {errors.owner ? <div className="errorText">{errors.owner}</div> : null}
            </div>

            <div className="field">
              <label className="label" htmlFor="status">Status</label>
              <select
                id="status"
                className="select"
                value={values.status}
                onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="hr" />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btnPrimary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating…" : "Create action"}
            </button>
          </div>
        </form>
      </div>

      <div className="tableWrap">
        <table className="table" aria-label="Corrective actions">
          <thead>
            <tr>
              <th>Defect</th>
              <th>Title</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Status</th>
              <th>Overdue</th>
              <th>Quick</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => {
              const closed = Boolean(a.is_closed || a.closed || String(a.status || "").toLowerCase() === "closed");
              const overdue = isOverdue(a.due_date || a.dueDate, closed);
              return (
                <tr key={a.id || a.title}>
                  <td><code>{a.defect || a.defect_id || "—"}</code></td>
                  <td>
                    {a.title || a.name || "Untitled action"}
                    {a.description ? <div className="help">{a.description}</div> : null}
                  </td>
                  <td>{a.owner || a.assignee || "—"}</td>
                  <td>{fmtDate(a.due_date || a.dueDate)}</td>
                  <td><span className={statusBadge(a.status || (closed ? "closed" : "open"))}>{a.status || (closed ? "closed" : "open")}</span></td>
                  <td>{overdue ? <span className="badge badgeDanger">Yes</span> : <span className="badge">No</span>}</td>
                  <td>
                    {a.id ? (
                      <button className="btn" onClick={() => onToggleClosed(a)}>
                        {closed ? "Reopen" : "Close"}
                      </button>
                    ) : (
                      <span className="help">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {actions.length === 0 ? (
              <tr><td colSpan={7} className="help" style={{ padding: 14 }}>No corrective actions yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
