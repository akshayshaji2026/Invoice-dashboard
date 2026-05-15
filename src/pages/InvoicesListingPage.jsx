import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FilePlus2,
  ListFilter,
  MoreHorizontal,
  Search,
  Send,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import { useInvoices } from "../context/InvoiceContext.jsx";
import {
  useScrollDepth,
  useSetInvoiceListingHeaderActions,
} from "../context/LayoutScrollContext.jsx";
import {
  clientAvatarSrc,
  formatInvoiceDateShort,
  formatInvoiceINR,
  getPriorityBadgeStyles,
  getPriorityFromInvoice,
  getStatusBadgeStyles,
} from "../../components/invoiceTableShared.jsx";

const PAGE_SIZE = 10;

const TABS = [
  { id: "all", label: "All Invoices", filterStatus: null },
  { id: "paid", label: "Paid", filterStatus: "paid" },
  { id: "pending", label: "Pending", filterStatus: "pending" },
  { id: "overdue", label: "Overdue", filterStatus: "overdue" },
];

function resolveIssueDate(inv) {
  if (inv.issueDate) return inv.issueDate;
  if (inv.createdAt) return inv.createdAt.slice(0, 10);
  return inv.dueDate;
}

const ghostActionBtnClass =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E8E9F0] bg-white px-4 text-sm font-medium text-[#303973] shadow-[0px_1px_2px_rgba(48,57,115,0.06)] transition hover:border-[#D4D8F0] hover:bg-[#F5F7FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25";

const listingActionIconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5E6685] transition-all duration-200 hover:bg-[#2F51A1]/10 hover:text-[#2F51A1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25";

function InvoiceListingHero({ filterChromeVisible, onToggleFilters, onExportCsv }) {
  const navigate = useNavigate();
  const { isScrolled } = useScrollDepth();

  const goBackFromListing = () => {
    navigate(-1);
  };

  return (
    <section className="px-1 py-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-h-[44px] items-center">
          {!isScrolled ? (
            <button
              type="button"
              onClick={goBackFromListing}
              className="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium text-[#303973] transition hover:bg-[#2F51A1]/[0.06] hover:text-[#2F51A1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" strokeWidth={1.85} aria-hidden />
              Back
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            className={ghostActionBtnClass}
            aria-pressed={filterChromeVisible}
            aria-label="Toggle filters"
            onClick={onToggleFilters}
          >
            <ListFilter className="h-4 w-4 text-[#303973]" strokeWidth={1.85} aria-hidden />
            <span>Filter</span>
          </button>
          <button type="button" className={ghostActionBtnClass} aria-label="Export invoices" onClick={onExportCsv}>
            <Download className="h-4 w-4 text-[#303973]" strokeWidth={1.85} aria-hidden />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/add-invoice")}
            className="flex h-11 items-center justify-center gap-2.5 rounded-xl bg-[#2F51A1] px-4 font-normal text-white transition hover:bg-[#254278]"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#254278] text-white">
              <FilePlus2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm">Add Invoice</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function RowActionsMenu({ invoiceId, currentStatus, onMarkStatus }) {
  const [open, setOpen] = useState(false);
  const options = ["Pending", "Paid", "Overdue"].filter((s) => s !== currentStatus);

  return (
    <div className="relative inline-flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[listingActionIconBtnClass, open ? "bg-[#2F51A1]/10 text-[#2F51A1]" : ""].filter(Boolean).join(" ")}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`More actions for ${invoiceId}`}
      >
        <MoreHorizontal size={16} strokeWidth={1.8} />
      </button>
      {open ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-[#ECECEC] bg-white py-1 text-left shadow-[0px_8px_24px_rgba(48,57,115,0.14)]">
            {options.map((status) => (
              <button
                key={status}
                type="button"
                className="w-full px-3 py-2 text-left text-xs font-medium text-[#303973] hover:bg-[#F5F7FF]"
                onClick={() => {
                  onMarkStatus(status);
                  setOpen(false);
                }}
              >
                Mark {status}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

const rowGrid =
  "grid grid-cols-[minmax(84px,0.8fr)_minmax(156px,1.35fr)_minmax(84px,0.9fr)_minmax(92px,0.9fr)_minmax(108px,1fr)_minmax(100px,0.95fr)_minmax(96px,0.85fr)] gap-x-5 sm:gap-x-6";

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export default function InvoicesListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterFromQuery = searchParams.get("filter");
  const { invoices, updateInvoiceStatus } = useInvoices();
  const setInvoiceListingHeaderActions = useSetInvoiceListingHeaderActions();
  const [activeTabId, setActiveTabId] = useState("all");
  const [searchRaw, setSearchRaw] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [filterChromeVisible, setFilterChromeVisible] = useState(true);

  useEffect(() => {
    if (!filterFromQuery) return;
    const normalized = filterFromQuery.trim().toLowerCase();
    const tab = TABS.find((t) => t.id === normalized);
    if (tab) {
      setActiveTabId(tab.id);
      setPageIndex(0);
    }
  }, [filterFromQuery]);

  const sorted = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const na = Number(String(a.id).replace(/\D/g, "")) || 0;
      const nb = Number(String(b.id).replace(/\D/g, "")) || 0;
      return nb - na;
    });
  }, [invoices]);

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTabId);
    const q = searchRaw.trim().toLowerCase();
    return sorted.filter((inv) => {
      if (tab?.filterStatus) {
        const st = (inv.status || "").toLowerCase();
        if (st !== tab.filterStatus) return false;
      }
      if (!q) return true;
      return inv.id?.toLowerCase().includes(q) || inv.client?.toLowerCase().includes(q);
    });
  }, [sorted, activeTabId, searchRaw]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageIndex, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, filtered.length]);

  const toggleFilters = useCallback(() => {
    setFilterChromeVisible((v) => !v);
  }, []);

  const exportFilteredCsv = useCallback(() => {
    const headers = ["Invoice ID", "Client", "Company", "Amount (INR)", "Status", "Priority", "Due date", "Issue date"];
    const lines = [headers.join(",")];
    for (const inv of filtered) {
      const issue = resolveIssueDate(inv);
      lines.push(
        [
          csvEscape(inv.id),
          csvEscape(inv.client),
          csvEscape(inv.company),
          csvEscape(inv.amount),
          csvEscape(inv.status),
          csvEscape(getPriorityFromInvoice(inv)),
          csvEscape(inv.dueDate),
          csvEscape(issue),
        ].join(","),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useEffect(() => {
    setInvoiceListingHeaderActions({
      toggleFilters,
      exportCsv: exportFilteredCsv,
      filtersVisible: filterChromeVisible,
    });
    return () => setInvoiceListingHeaderActions(null);
  }, [toggleFilters, exportFilteredCsv, filterChromeVisible, setInvoiceListingHeaderActions]);

  return (
    <MainLayout title="Invoices">
      <InvoiceListingHero
        filterChromeVisible={filterChromeVisible}
        onToggleFilters={toggleFilters}
        onExportCsv={exportFilteredCsv}
      />

      <section className="rounded-[16px] border border-[#ECECEC] bg-white p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.1)]">
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            filterChromeVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div
            className={`min-h-0 overflow-hidden transition-opacity duration-300 ease-out ${
              filterChromeVisible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-6 border-b border-[#F0F0F0] pb-px">
                {TABS.map((tab) => {
                  const active = tab.id === activeTabId;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTabId(tab.id);
                        setPageIndex(0);
                      }}
                      className={[
                        "-mb-px rounded-t-md border-b-2 px-2 pb-3 pt-1 text-sm transition-all duration-200",
                        active
                          ? "border-[#2F51A1] text-[#2F51A1] font-semibold"
                          : "border-transparent font-medium text-[#71717A] hover:bg-[#2F51A1]/[0.06] hover:text-[#52525B]",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#828BB9]" aria-hidden />
                <input
                  type="search"
                  value={searchRaw}
                  onChange={(e) => {
                    setSearchRaw(e.target.value);
                    setPageIndex(0);
                  }}
                  placeholder="Search by Client or Invoice ID"
                  className="h-10 w-full rounded-2xl border border-[#E8E8EC] bg-white py-2 pl-11 pr-4 text-sm text-[#1C1C1C] shadow-[0px_0px_2px_rgba(48,57,115,0.06)] placeholder:text-[#B1B1C2] focus:border-[#E8E8EC] focus:outline-none focus:ring-0 hover:border-[#E8E8EC]"
                  aria-label="Search invoices"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#ECECEC]">
          <div className="min-w-[1080px]">
            <div
              className={`${rowGrid} bg-[#EFEFFA] px-3 py-3 text-xs font-medium text-[#575E78] font-[Inter,ui-sans-serif,system-ui,sans-serif] sm:px-4`}
            >
              <div className="px-0.5">Invoice ID</div>
              <div className="px-0.5">Client</div>
              <div className="px-0.5">Amount</div>
              <div className="px-0.5">Issue Date</div>
              <div className="px-1">Status</div>
              <div className="px-1">Priority</div>
              <div className="px-0.5 text-center">Actions</div>
            </div>

            {pageRows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#828BB9]">No invoices match your filters.</div>
            ) : (
              pageRows.map((row, index) => {
                const sBadge = getStatusBadgeStyles(row.status);
                const priorityLabel = getPriorityFromInvoice(row);
                const pBadge = getPriorityBadgeStyles(priorityLabel);
                const issue = resolveIssueDate(row);
                const isLast = index === pageRows.length - 1;

                return (
                  <div
                    key={row.id}
                    className={[
                      `${rowGrid} items-center px-3 py-3.5 font-[Inter,ui-sans-serif,system-ui,sans-serif] sm:px-4`,
                      isLast ? "" : "border-b border-[#F0F0F0]",
                    ].join(" ")}
                  >
                    <div className="px-0.5">
                      <Link
                        to={`/invoices/view/${encodeURIComponent(row.id)}`}
                        className="cursor-pointer text-sm font-semibold leading-tight text-[#2F51A1] underline-offset-2 transition-all duration-200 hover:underline hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8E8EC] rounded-sm"
                      >
                        {row.id}
                      </Link>
                    </div>

                    <div className="flex min-w-0 items-center gap-3 px-0.5">
                      <img
                        src={clientAvatarSrc(row.client)}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full border border-[#ECECEC] object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium leading-tight text-[#1C1C1C]">{row.client}</div>
                        <div className="mt-1 truncate text-xs font-normal text-[#B1B1C2]">{row.company}</div>
                      </div>
                    </div>

                    <div className="px-0.5 text-sm font-medium text-[#1C1C1C]">{formatInvoiceINR(row.amount)}</div>

                    <div className="px-0.5 text-sm font-normal text-[#1C1C1C]">{formatInvoiceDateShort(issue)}</div>

                    <div className="px-1">
                      <span
                        className={[
                          "inline-flex max-w-fit items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium",
                          sBadge.bg,
                          sBadge.text,
                        ].join(" ")}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: sBadge.dot }} />
                        {row.status}
                      </span>
                    </div>

                    <div className="px-1">
                      <span
                        className={`inline-flex max-w-fit items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide font-[Inter,ui-sans-serif,system-ui,sans-serif] ${pBadge.bg} ${pBadge.text} ${pBadge.border}`}
                      >
                        {String(priorityLabel).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1 px-0.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/invoices/view/${encodeURIComponent(row.id)}`)}
                        className={listingActionIconBtnClass}
                        aria-label={`View ${row.id}`}
                      >
                        <Eye size={15} strokeWidth={1.8} />
                      </button>
                      <button type="button" className={listingActionIconBtnClass} aria-label={`Send ${row.id}`}>
                        <Send size={15} strokeWidth={1.8} />
                      </button>
                      <RowActionsMenu
                        invoiceId={row.id}
                        currentStatus={row.status}
                        onMarkStatus={(st) => updateInvoiceStatus(row.id, st)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <footer className="mt-6 flex flex-col gap-4 border-t border-[#F0F0F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#828BB9]">
            Showing <span className="font-semibold text-[#303973]">{filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}</span>
            –
            <span className="font-semibold text-[#303973]">{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}</span> of{" "}
            <span className="font-semibold text-[#303973]">{filtered.length}</span> invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm font-medium text-[#303973] shadow-sm transition hover:bg-[#F8F9FF] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
            </button>
            <span className="px-3 text-sm font-medium text-[#717BBC]">
              Page <span className="text-[#303973]">{safePage + 1}</span> / {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm font-medium text-[#303973] shadow-sm transition hover:bg-[#F8F9FF] disabled:opacity-40"
              aria-label="Next page"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </footer>
      </section>
    </MainLayout>
  );
}
