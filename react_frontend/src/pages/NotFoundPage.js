import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";

/**
 * PUBLIC_INTERFACE
 * 404 page.
 */
export default function NotFoundPage() {
  return (
    <Layout title="Page not found" subtitle="The page you requested does not exist.">
      <div className="card">
        <p className="help">
          Use navigation on the left or go back to the dashboard.
        </p>
        <Link className="btn btnPrimary" to="/">
          Go to Dashboard
        </Link>
      </div>
    </Layout>
  );
}
