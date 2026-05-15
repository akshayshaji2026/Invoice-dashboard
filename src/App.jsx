import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";
import AddInvoicePage from "./pages/AddInvoicePage.jsx";
import InvoicesListingPage from "./pages/InvoicesListingPage.jsx";
import InvoicePreviewPage from "./pages/InvoicePreviewPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/invoices" element={<InvoicesListingPage />} />
      <Route path="/invoices/view/:id" element={<InvoicePreviewPage />} />
      <Route path="/add-invoice" element={<AddInvoicePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}