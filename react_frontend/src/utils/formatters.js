/**
 * Formatting helpers for UI.
 */

/**
 * PUBLIC_INTERFACE
 * Best-effort date formatting.
 */
export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

/**
 * PUBLIC_INTERFACE
 * Returns true if dueDate is in the past and not closed.
 */
export function isOverdue(dueDate, isClosed) {
  if (!dueDate || isClosed) return false;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  // Compare date-only
  return d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/**
 * PUBLIC_INTERFACE
 * Map severity to badge class.
 */
export function severityBadge(sev) {
  const s = String(sev || "").toLowerCase();
  if (["critical", "1", "p0"].includes(s)) return "badge badgeDanger";
  if (["high", "2", "p1"].includes(s)) return "badge badgeWarning";
  if (["medium", "3", "p2"].includes(s)) return "badge badgePrimary";
  if (["low", "4", "p3"].includes(s)) return "badge badgeSuccess";
  return "badge";
}

/**
 * PUBLIC_INTERFACE
 * Map generic status to badge class.
 */
export function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (["closed", "done", "resolved", "verified"].includes(s)) return "badge badgeSuccess";
  if (["overdue", "blocked"].includes(s)) return "badge badgeDanger";
  if (["in_progress", "in progress", "investigating", "open"].includes(s)) return "badge badgePrimary";
  return "badge";
}
