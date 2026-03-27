import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import DashboardPage from "./pages/DashboardPage";
import DefectsListPage from "./pages/DefectsListPage";
import DefectCreatePage from "./pages/DefectCreatePage";
import DefectDetailPage from "./pages/DefectDetailPage";
import ActionsPage from "./pages/ActionsPage";
import RcaPage from "./pages/RcaPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * PUBLIC_INTERFACE
 * Application entry component for the Quality Defect Management System.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/defects" element={<DefectsListPage />} />
        <Route path="/defects/new" element={<DefectCreatePage />} />
        <Route path="/defects/:defectId" element={<DefectDetailPage />} />
        <Route path="/actions" element={<ActionsPage />} />
        <Route path="/rca" element={<RcaPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
