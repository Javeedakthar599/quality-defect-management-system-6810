import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { createDefect } from "../api/qdmApi";
import { validateDefect } from "../utils/validators";

/**
 * PUBLIC_INTERFACE
 * Defect create page.
 */
export default function DefectCreatePage() {
  const nav = useNavigate();

  // Defensive: keep option arrays local and always defined so we never `.map` on undefined.
  // This prevents the "Cannot read properties of undefined (reading 'map')" crash seen in the screenshot.
  const SEVERITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const PRIORITY_OPTIONS = ["P1", "P2", "P3", "P4"];

  const [values, setValues] = useState({
    defect_id: "",
    title: "",
    description: "",
    // Backend enums are uppercase (see openapi + Django model choices)
    severity: "MEDIUM",
    priority: "P2",
    status: "NEW",
    detected_on: new Date().toISOString().slice(0, 10),
    owner: ""
  });
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Convert DRF-style error payloads into a flat {field: "msg"} map.
   * Examples:
   *  - {"defect_id":["This field is required."]}
   *  - {"non_field_errors":["..."]}
   */
  function applyApiErrors(err) {
    const payload = err?.payload;
    if (!payload || typeof payload !== "object") return false;

    const nextErrors = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (!v) return;
      const msg = Array.isArray(v) ? v.join(", ") : String(v);
      nextErrors[k] = msg;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      // Prefer non-field errors in the banner; otherwise show nothing here
      const banner =
        nextErrors.non_field_errors ||
        nextErrors.detail ||
        "";
      setSubmitErr(banner);
      return true;
    }
    return false;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitErr("");

    const v = validateDefect(values);
    setErrors(v.errors);
    if (!v.valid) return;

    setIsSubmitting(true);
    try {
      const created = await createDefect(values);
      const id = created?.id;
      if (id) nav(`/defects/${id}`);
      else nav("/defects");
    } catch (err) {
      const handled = applyApiErrors(err);
      if (!handled) setSubmitErr(err?.message || "Failed to create defect.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout
      title="Log New Defect"
      subtitle="Capture defect details; workflow is enforced by backend, validated in UI"
    >
      {submitErr ? <div className="alert alertDanger">{submitErr}</div> : null}

      <form className="card" onSubmit={onSubmit}>
        <div className="fieldRow">
          <div className="field">
            <label className="label" htmlFor="defect_id">Defect ID</label>
            <input
              id="defect_id"
              className="input"
              value={values.defect_id}
              onChange={(e) => setValues((v) => ({ ...v, defect_id: e.target.value }))}
              placeholder="e.g., DF-1001"
            />
            {errors.defect_id ? <div className="errorText">{errors.defect_id}</div> : <div className="help">Required. Human-friendly identifier.</div>}
          </div>

          <div className="field fieldFull">
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="Short summary of the defect"
            />
            {errors.title ? <div className="errorText">{errors.title}</div> : <div className="help">Max 120 characters.</div>}
          </div>

          <div className="field fieldFull">
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="textarea"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="Steps to reproduce, observed vs expected, context, attachments references…"
            />
            {errors.description ? <div className="errorText">{errors.description}</div> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="severity">Severity</label>
            <select
              id="severity"
              className="select"
              value={values.severity}
              onChange={(e) => setValues((v) => ({ ...v, severity: e.target.value }))}
            >
              {(SEVERITY_OPTIONS || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0) + opt.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.severity ? <div className="errorText">{errors.severity}</div> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="priority">Priority</label>
            <select
              id="priority"
              className="select"
              value={values.priority}
              onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value }))}
            >
              {(PRIORITY_OPTIONS || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.priority ? <div className="errorText">{errors.priority}</div> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="detected_on">Detected date</label>
            <input
              id="detected_on"
              className="input"
              type="date"
              value={values.detected_on}
              onChange={(e) => setValues((v) => ({ ...v, detected_on: e.target.value }))}
            />
            {errors.detected_on ? <div className="errorText">{errors.detected_on}</div> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="owner">Owner / Reporter</label>
            <input
              id="owner"
              className="input"
              value={values.owner}
              onChange={(e) => setValues((v) => ({ ...v, owner: e.target.value }))}
              placeholder="Who reported or owns triage"
            />
            <div className="help">Optional.</div>
          </div>
        </div>

        <div className="hr" />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancel
          </button>
          <button disabled={isSubmitting} className="btn btnPrimary" type="submit">
            {isSubmitting ? "Creating…" : "Create defect"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
