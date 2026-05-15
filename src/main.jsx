import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { InvoiceProvider } from "./context/InvoiceContext.jsx";
import { LayoutScrollProvider } from "./context/LayoutScrollContext.jsx";
import { DashboardModalProvider } from "./context/DashboardModalContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LayoutScrollProvider>
        <InvoiceProvider>
          <SettingsProvider>
            <DashboardModalProvider>
              <App />
            </DashboardModalProvider>
          </SettingsProvider>
        </InvoiceProvider>
      </LayoutScrollProvider>
    </BrowserRouter>
  </React.StrictMode>
);

