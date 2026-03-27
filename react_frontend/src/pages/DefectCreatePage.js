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
  const [values, setValues] = useState({
    title: "",
    description: "",
    severity: "medium",
    priority: "p2",
    status: "open",
    detected_at: new Date().toISOString().slice(0, 10),
    owner: ""
  });
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSubmitErr(err?.message || "Failed to create defect.");
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
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
              <option value="p0">P0</option>
              <option value="p1">P1</option>
              <option value="p2">P2</option>
              <option value="p3">P3</option>
            </select>
            {errors.priority ? <div className="errorText">{errors.priority}</div> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="detected_at">Detected date</label>
            <input
              id="detected_at"
              className="input"
              type="date"
              value={values.detected_at}
              onChange={(e) => setValues((v) => ({ ...v, detected_at: e.target.value }))}
            />
            {errors.detected_at ? <div className="errorText">{errors.detected_at}</div> : null}
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
            <div className="help">Optional if backend assigns automatically.</div>
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
