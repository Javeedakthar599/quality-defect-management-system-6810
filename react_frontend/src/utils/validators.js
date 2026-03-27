/**
 * Basic validation for demo-ready workflow enforcement at the UI layer.
 */

/**
 * PUBLIC_INTERFACE
 * Validate defect creation form.
 * @returns {{valid:boolean, errors: Record<string,string>}}
 */
export function validateDefect(values) {
  const errors = {};
  const defectId = (values.defect_id || "").trim();
  const title = (values.title || "").trim();
  const description = (values.description || "").trim();

  if (!defectId) errors.defect_id = "Defect ID is required.";
  if (!title) errors.title = "Title is required.";
  if (title.length > 120) errors.title = "Title must be <= 120 characters.";
  if (!description) errors.description = "Description is required.";
  if (!values.severity) errors.severity = "Severity is required.";
  if (!values.priority) errors.priority = "Priority is required.";
  if (!values.detected_on) errors.detected_on = "Detected date is required.";

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * PUBLIC_INTERFACE
 * Validate corrective action form.
 */
export function validateAction(values) {
  const errors = {};
  if (!values.defect) errors.defect = "Defect is required.";
  if (!(values.title || "").trim()) errors.title = "Action title is required.";
  if (!values.owner) errors.owner = "Owner is required.";
  if (!values.due_date) errors.due_date = "Due date is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * PUBLIC_INTERFACE
 * Validate 5-Why RCA form.
 */
export function validateRca(values) {
  const errors = {};
  if (!values.defect) errors.defect = "Defect is required.";
  const whys = values.whys || [];
  if (!Array.isArray(whys) || whys.length < 3) {
    errors.whys = "Provide at least 3 'Why' steps (recommended 5).";
  } else if (whys.some((w) => !(String(w || "").trim()))) {
    errors.whys = "All 'Why' steps must be non-empty.";
  }
  if (!(values.root_cause || "").trim()) errors.root_cause = "Root cause summary is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}
