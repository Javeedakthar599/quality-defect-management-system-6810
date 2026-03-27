import React, { useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { usePolling } from "../hooks/usePolling";
import { createRca, listDefects, listRca } from "../api/qdmApi";
import { fmtDate } from "../utils/formatters";
import { validateRca } from "../utils/validators";

function normalizeList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

/**
 * PUBLIC_INTERFACE
 * Root Cause Analysis page (5-Why).
 */
export default function RcaPage() {
  const { data: defectsPayload } = usePolling(() => listDefects({ ordering: "-created_at" }), [], undefined);
  const defects = useMemo(() => normalizeList(defectsPayload), [defectsPayload]);

  const { data: rcaPayload, error: rcaErr } = usePolling(() => listRca({ ordering: "-created_at" }), [], undefined);
  const rcaList = useMemo(() => normalizeList(rcaPayload), [rcaPayload]);

  const [values, setValues] = useState({
    defect: "",
    whys: ["", "", "", "", ""],
    root_cause: ""
  });
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitErr("");

    const payload = {
      defect: values.defect,
      whys: values.whys.filter((w) => String(w || "").trim() !== ""),
      root_cause: values.root_cause
    };

    const v = validateRca(payload);
    setErrors(v.errors);
    if (!v.valid) return;

    setSubmitting(true);
    try {
      await createRca(payload);
      setValues((prev) => ({ ...prev, root_cause: "", whys: ["", "", "", "", ""] }));
    } catch (e2) {
      setSubmitErr(e2?.message || "Failed to save RCA.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="Root Cause (5-Why)" subtitle="Structured analysis and corrective linkage">
      {rcaErr ? <div className="alert alertWarning">{rcaErr}</div> : null}
      {submitErr ? <div className="alert alertDanger">{submitErr}</div> : null}

      <div className="split">
        <div className="card">
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Create 5-Why Analysis</p>
              <p className="cardSubtitle">At least 3 steps required (5 recommended)</p>
            </div>
            <span className="badge badgePrimary">RCA</span>
          </div>

          <form onSubmit={onSubmit}>
            <div className="fieldRow">
              <div className="field fieldFull">
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

              <div className="field fieldFull">
                <label className="label">Why chain</label>
                {values.whys.map((w, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, marginBottom: 8 }}>
                    <div className="pill" style={{ textAlign: "center" }}>Why #{idx + 1}</div>
                    <input
                      className="input"
                      value={w}
                      onChange={(e) => {
                        const next = [...values.whys];
                        next[idx] = e.target.value;
                        setValues((v) => ({ ...v, whys: next }));
                      }}
                      placeholder={idx === 0 ? "Why did the defect occur?" : "Because…"}
                    />
                  </div>
                ))}
                {errors.whys ? <div className="errorText">{errors.whys}</div> : null}
              </div>

              <div className="field fieldFull">
                <label className="label" htmlFor="root_cause">Root cause summary</label>
                <textarea
                  id="root_cause"
                  className="textarea"
                  value={values.root_cause}
                  onChange={(e) => setValues((v) => ({ ...v, root_cause: e.target.value }))}
                  placeholder="Concise statement of the underlying cause (process/system), not symptoms."
                />
                {errors.root_cause ? <div className="errorText">{errors.root_cause}</div> : null}
              </div>
            </div>

            <div className="hr" />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" disabled={submitting} type="submit">
                {submitting ? "Saving…" : "Save RCA"}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <p className="cardTitle">Recent RCAs</p>
              <p className="cardSubtitle">Latest analyses</p>
            </div>
            <span className="badge">Live</span>
          </div>

          {rcaList.length === 0 ? (
            <div className="alert">No RCA entries found.</div>
          ) : (
            <div className="miniList">
              {rcaList.slice(0, 8).map((r) => (
                <div className="miniItem" key={r.id || `${r.defect}-${r.created_at}`}>
                  <div className="miniItemHeader">
                    <div>
                      <div className="miniItemTitle">{r.root_cause || r.summary || "RCA"}</div>
                      <div className="help">
                        Defect: <code>{r.defect || r.defect_id || "—"}</code> · {fmtDate(r.created_at || r.createdAt)}
                      </div>
                    </div>
                    <span className="badge badgePrimary">{Array.isArray(r.whys) ? `${r.whys.length} whys` : "RCA"}</span>
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
        </div>
      </div>
    </Layout>
  );
}
