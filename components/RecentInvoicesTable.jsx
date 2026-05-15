import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Download, Send } from "lucide-react";
import { useInvoices } from "../src/context/InvoiceContext.jsx";
import { useLayoutScroll } from "../src/context/LayoutScrollContext.jsx";
import { matchesInvoiceClientSearch } from "../src/utils/searchFilter.js";
import {
  formatInvoiceINR,
  formatInvoiceDateShort,
  getDueMeta,
  getStatusBadgeStyles,
} from "./invoiceTableShared.jsx";

const recentActionIconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5E6685] transition-all duration-200 hover:bg-[#2F51A1]/10 hover:text-[#2F51A1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25";

function getInvoiceNumber(id) {
  const match = id.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export default function RecentInvoicesTable() {
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const { searchQuery } = useLayoutScroll();
  const recentRows = useMemo(() => {
    return [...invoices]
      .sort((a, b) => getInvoiceNumber(b.id) - getInvoiceNumber(a.id))
      .slice(0, 8)
      .filter((row) => matchesInvoiceClientSearch(row, searchQuery));
  }, [invoices, searchQuery]);
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <section className="relative w-full min-w-0 rounded-[16px] border border-[#ECECEC] bg-white p-4 font-['Inter',ui-sans-serif,system-ui,sans-serif] shadow-[0px_1px_8px_rgba(54,76,215,0.1)] sm:p-5">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 text-base font-semibold leading-[1.2] tracking-[-0.03em] text-[#17171B] font-['Inter',ui-sans-serif,system-ui,sans-serif] md:text-lg">
            Recent Invoices
          </h3>
          <Link
            to="/invoices"
            className="shrink-0 text-sm font-medium text-[#2F51A1] transition-all duration-200 hover:opacity-80"
          >
            View All
          </Link>
        </div>
        <p className="dashboard-card-subtitle mt-1 truncate">
          Latest billing activity across your account
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[#ECECEC]">
        <div className="min-w-[720px]">
        <div className="grid grid-cols-[0.9fr_1.3fr_1fr_1fr_0.8fr_0.8fr] gap-x-6 bg-[#EFEFFA] px-4 py-3 text-xs font-medium text-[#575E78]">
          <div>Invoice ID</div>
          <div>Client</div>
          <div>Amount</div>
          <div>Due Date</div>
          <div>Status</div>
          <div className="text-center">Actions</div>
        </div>

        <div>
          {recentRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#B1B1C2]">
              {hasSearch ? "No matching invoices found" : "No invoices to show"}
            </p>
          ) : null}
          {recentRows.map((row, index) => {
            const badge = getStatusBadgeStyles(row.status);
            const dueMeta = getDueMeta(row);
            const isLast = index === recentRows.length - 1;

            return (
              <div
                key={row.id}
                className={[
                  "grid grid-cols-[0.9fr_1.3fr_1fr_1fr_0.8fr_0.8fr] gap-x-6 px-4 py-3.5 items-center",
                  isLast ? "" : "border-b border-[#F0F0F0]",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/invoices/view/${encodeURIComponent(row.id)}`)}
                  className="w-fit cursor-pointer text-left text-sm font-semibold leading-tight text-[#2F51A1] underline-offset-2 transition-all duration-200 hover:underline"
                  aria-label={`Open invoice ${row.id}`}
                >
                  {row.id}
                </button>

                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight text-[#1C1C1C]">{row.client}</div>
                  <div className="mt-1 truncate text-xs font-normal text-[#B1B1C2]">
                    {row.billingContact?.trim()
                      ? [row.billingContact.trim(), row.company?.trim()].filter(Boolean).join(" · ")
                      : row.company?.trim() || "—"}
                  </div>
                </div>

                <div className="text-sm font-medium text-[#1C1C1C]">{formatInvoiceINR(row.amount)}</div>

                <div>
                  <div className="text-sm font-normal leading-tight text-[#1C1C1C]">
                    {formatInvoiceDateShort(row.dueDate)}
                  </div>
                  {dueMeta ? (
                    <div className={`mt-1 text-xs font-medium ${dueMeta.className}`}>{dueMeta.text}</div>
                  ) : null}
                </div>

                <div>
                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-medium",
                      badge.bg,
                      badge.text,
                    ].join(" ")}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                    {row.status}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/invoices/view/${encodeURIComponent(row.id)}`)}
                    className={recentActionIconBtnClass}
                    aria-label={`View ${row.id}`}
                  >
                    <Eye size={15} strokeWidth={1.8} />
                  </button>
                  <button type="button" className={recentActionIconBtnClass} aria-label={`Download ${row.id}`}>
                    <Download size={15} strokeWidth={1.8} />
                  </button>
                  <button type="button" className={recentActionIconBtnClass} aria-label={`Send reminder for ${row.id}`}>
                    <Send size={15} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
