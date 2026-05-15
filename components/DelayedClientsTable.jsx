import React, { useMemo } from "react";
import { delayedClientsData } from "../data/mockData";
import { useLayoutScroll } from "../src/context/LayoutScrollContext.jsx";
import { matchesInvoiceClientSearch } from "../src/utils/searchFilter.js";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DelayedClientsTable() {
  const { searchQuery } = useLayoutScroll();
  const filteredRows = useMemo(
    () => delayedClientsData.filter((row) => matchesInvoiceClientSearch(row, searchQuery)),
    [searchQuery],
  );
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <section className="relative rounded-[16px] border border-[#ECECEC] bg-white p-4 shadow-[0px_1px_8px_rgba(54,76,215,0.1)] sm:p-5">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-text-primary md:text-lg">
          Top Delayed Clients
        </h3>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[#ECECEC]">
        <div className="min-w-[560px]">
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-x-6 bg-[#EFEFFA] px-4 py-3 text-xs font-medium text-[#575E78]">
          <div>Client</div>
          <div className="text-right">Pending Amount</div>
          <div className="text-right">Delay Days</div>
          <div className="text-left">Priority</div>
        </div>

        <div>
          {filteredRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#B1B1C2]">
              {hasSearch ? "No matching clients found" : "No delayed clients to show"}
            </p>
          ) : null}
          {filteredRows.map((row, index) => (
            <ClientRow
              key={row.id}
              row={row}
              isLast={index === filteredRows.length - 1}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function ClientRow({ row, isLast }) {
  const badge = getPriorityBadge(row.priority);
  const delayTextColor =
    row.priority === "High" ? "text-[#CE2222]" : "text-[#D97E1C]";

  return (
    <div
      className={[
        "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-x-6 px-4 py-4 items-center",
        isLast ? "" : "border-b border-[#F0F0F0]",
      ].join(" ")}
    >
      <div className="text-sm font-medium text-brand-primary cursor-pointer hover:underline">
        <div className="leading-tight">{row.client}</div>
      </div>
      <div className="text-sm font-medium text-[#1C1C1C] text-right">
        {formatINR(row.pendingAmount)}
      </div>
      <div className={`text-sm font-medium text-right ${delayTextColor}`}>
        {row.delayDays} days
      </div>
      <div>
        <span
          className={[
            "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-medium",
            badge.bg,
            badge.text,
          ].join(" ")}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: badge.dot }}
          />
          {row.priority}
        </span>
      </div>
    </div>
  );
}

function getPriorityBadge(priority) {
  if (priority === "High") {
    return {
      bg: "bg-[#FCE3E3]",
      text: "text-[#CE2222]",
      dot: "#C81A1A",
    };
  }

  return {
    bg: "bg-[#FFF3E8]",
    text: "text-[#D97E1C]",
    dot: "#D97E1C",
  };
}

