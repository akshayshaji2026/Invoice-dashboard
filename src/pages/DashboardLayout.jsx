import React from "react";
import RevenueChart from "../../components/RevenueChart.jsx";
import InvoiceStatusDonut from "../../components/InvoiceStatusDonut.jsx";
import DelayedClientsTable from "../../components/DelayedClientsTable.jsx";
import RightPanel from "../../components/RightPanel.jsx";
import RecentInvoicesTable from "../../components/RecentInvoicesTable.jsx";

/** Full-height flex track so the sidebar stack can stretch (Weekly Forecast fills remainder). */
const sidebarColumnStyle = {
  alignSelf: "stretch",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

/** Scroll with page; hold when the feed bottom is 24px above the viewport bottom. */
const sidebarStickyStyle = {
  position: "sticky",
  bottom: "24px",
  top: "auto",
};

/**
 * Zone A: chart (8 cols) + sidebar track (4 cols) in `items-start` grid.
 * Zone B: Recent Invoices is outside the grid with `mt-6`.
 */
export default function DashboardLayout() {
  return (
    <div className="w-full min-w-0 overflow-visible">
      <div className="grid w-full grid-cols-12 items-start gap-4 overflow-visible md:gap-6">
        <div className="col-span-12 min-h-0 min-w-0 space-y-6 lg:col-span-7 xl:col-span-8">
          <RevenueChart />
          <InvoiceStatusDonut />
          <DelayedClientsTable />
        </div>

        <div
          className="col-span-12 flex min-h-0 min-w-0 flex-col lg:col-span-5 lg:min-w-[240px] xl:col-span-4 xl:min-w-0"
          style={sidebarColumnStyle}
        >
          <div
            className="flex h-full min-h-0 w-full flex-1 flex-col"
            style={sidebarStickyStyle}
          >
            <RightPanel />
          </div>
        </div>
      </div>

      <div className="mt-6 w-full min-w-0">
        <RecentInvoicesTable />
      </div>
    </div>
  );
}
