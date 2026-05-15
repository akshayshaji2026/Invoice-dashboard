import React from "react";
import RevenueChart from "./RevenueChart";
import DelayedClientsTable from "./DelayedClientsTable";
import InvoiceStatusDonut from "./InvoiceStatusDonut";

export default function MainContent() {
  return (
    <div className="space-y-6">
      {/* StatsCards is GONE from here now */}
      <RevenueChart />
      <InvoiceStatusDonut />
      <DelayedClientsTable />
    </div>
  );
}
