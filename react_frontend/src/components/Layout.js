import React from "react";
import { NavLink, useLocation } from "react-router-dom";

/**
 * Sidebar navigation items.
 */
const NAV = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/defects", label: "Defects", icon: "🧾" },
  { to: "/defects/new", label: "New Defect", icon: "➕" },
  { to: "/actions", label: "Corrective Actions", icon: "✅" },
  { to: "/rca", label: "Root Cause (5-Why)", icon: "🧠" }
];

/**
 * PUBLIC_INTERFACE
 * Application shell layout with sidebar and topbar.
 */
export function Layout({ title, subtitle, right, children }) {
  const loc = useLocation();

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brandMark" aria-hidden="true">
            QD
          </div>
          <div className="brandText">
            <strong>Quality Defects</strong>
            <span>Management System</span>
          </div>
        </div>

        <div className="navSection">
          <div className="navLabel">Navigate</div>
          <div className="navList">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `navItem ${isActive ? "navItemActive" : ""}`
                }
                aria-current={loc.pathname === n.to ? "page" : undefined}
              >
                <div className="navItemLeft">
                  <div className="navIcon" aria-hidden="true">
                    {n.icon}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{n.label}</div>
                </div>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>›</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="navSection">
          <div className="navLabel">Real-time</div>
          <div className="alert" role="note">
            This demo refreshes lists automatically via polling.
            <div className="help" style={{ marginTop: 6 }}>
              Interval:{" "}
              <code>{process.env.REACT_APP_POLL_INTERVAL_MS || 5000}ms</code>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="pageTitle">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="topbarRight">{right}</div>
        </div>

        {children}
      </main>
    </div>
  );
}
