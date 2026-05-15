import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Download, Printer, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import SideNavigation from "../../components/SideNavigation.jsx";
import InvoDashLogoMark from "../../components/InvoDashLogoMark.jsx";
import { useInvoices } from "../context/InvoiceContext.jsx";
import { useSettings, getCompanyFromBlock, getInvoiceLogoMode } from "../context/SettingsContext.jsx";
import { getStatusBadgeStyles } from "../../components/invoiceTableShared.jsx";
import { defaultInvoiceGreeting } from "../utils/invoiceGreeting.js";
import { ADD_INVOICE_DRAFT_VIEW_ID } from "../constants/invoiceDraftPreview.js";

const headerGradient = "bg-gradient-to-r from-[#303973] via-[#2F51A1] to-[#1D2450]";

const previewPageHeaderShellClass =
  "relative z-50 flex w-full min-w-0 items-center justify-between gap-4 rounded-[16px] border border-[#ECECEC]/90 bg-white/80 p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.1)] backdrop-blur-md backdrop-saturate-150";

const DEFAULT_TERMS_FALLBACK =
  "Payment is due by the due date shown above. Late payments may incur interest as permitted by law. All amounts are in Indian Rupees (INR).";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatHumanDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function splitLegacyCombinedNotes(raw) {
  if (!raw || typeof raw !== "string") {
    return { clientNotes: "", terms: "", attachment: "" };
  }
  const parts = raw
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const attachIdx = parts.findIndex((p) => /^attachment:\s*/i.test(p));
  const attachment =
    attachIdx >= 0 ? parts[attachIdx].replace(/^attachment:\s*/i, "").trim() : "";
  const rest = parts.filter((_, i) => i !== attachIdx);
  if (rest.length >= 2) {
    return {
      clientNotes: rest[0] || "",
      terms: rest.slice(1).join("\n\n") || "",
      attachment,
    };
  }
  if (rest.length === 1) {
    return { clientNotes: rest[0] || "", terms: "", attachment };
  }
  return { clientNotes: "", terms: "", attachment };
}

function resolveInvoiceCopy(invoice) {
  const usesStructuredFields =
    Object.prototype.hasOwnProperty.call(invoice, "clientNotes") ||
    Object.prototype.hasOwnProperty.call(invoice, "terms") ||
    Object.prototype.hasOwnProperty.call(invoice, "attachmentReference");

  if (usesStructuredFields) {
    return {
      clientNotes: (invoice.clientNotes ?? "").trim(),
      terms: (invoice.terms ?? "").trim(),
      attachment: (invoice.attachmentReference ?? "").trim(),
    };
  }

  return splitLegacyCombinedNotes(invoice.notes);
}

function buildDocumentModel(inv) {
  const grand = Number(inv.amount) || 0;
  if (Array.isArray(inv.lineItems) && inv.lineItems.length > 0) {
    const rows = inv.lineItems.map((l, i) => ({
      id: i,
      description: l.description || "Item",
      qty: Number(l.qty) || 0,
      rate: Number(l.rate) || 0,
      total: (Number(l.qty) || 0) * (Number(l.rate) || 0),
    }));
    const sub = typeof inv.subtotal === "number" ? inv.subtotal : rows.reduce((s, r) => s + r.total, 0);
    const tax = typeof inv.taxAmount === "number" ? inv.taxAmount : Math.max(0, grand - sub);
    return { rows, subtotal: sub, tax, grandTotal: grand };
  }
  const gstPct = typeof inv.gstPercent === "number" ? inv.gstPercent : 18;
  const subtotal = Math.round(grand / (1 + gstPct / 100));
  const tax = Math.max(0, grand - subtotal);
  return {
    rows: [
      {
        id: "default",
        description: "Professional services",
        qty: 1,
        rate: subtotal,
        total: subtotal,
      },
    ],
    subtotal,
    tax,
    grandTotal: grand,
  };
}

function HeaderDecorOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -right-8 top-0 h-40 w-40 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -left-6 bottom-2 h-32 w-32 rounded-full opacity-[0.12]"
        style={{
          background: "radial-gradient(circle, rgba(196,208,255,0.9) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 h-24 w-24 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #B4C4FF 0%, transparent 65%)",
        }}
      />
    </div>
  );
}

function ToolbarActions({ onDownloadPdf, onPrint, onShare }) {
  const btn =
    "print:hidden inline-flex h-10 items-center gap-2 rounded-xl border border-[#ECECEC] bg-white px-3.5 text-sm font-medium text-[#303973] shadow-sm transition hover:bg-[#F8F9FF]";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className={btn}
        onClick={onDownloadPdf}
        title="Save a PDF file directly (no print dialog)"
      >
        <Download className="h-4 w-4 text-[#5E6685]" aria-hidden /> Download PDF
      </button>
      <button type="button" className={btn} onClick={onPrint}>
        <Printer className="h-4 w-4 text-[#5E6685]" aria-hidden /> Print
      </button>
      <button type="button" className={btn} onClick={onShare}>
        <Share2 className="h-4 w-4 text-[#5E6685]" aria-hidden /> Share
      </button>
    </div>
  );
}

const STATUS_OPTIONS = ["Pending", "Paid", "Overdue"];

function InvoiceStatusBadgeSelect({ status, invoiceId, onChangeStatus, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const badgeStyles = getStatusBadgeStyles(status);
  const alternatives = STATUS_OPTIONS.filter((s) => s !== status);

  if (readOnly) {
    return (
      <div
        className={[
          "inline-flex h-10 cursor-default items-center gap-2 rounded-xl border border-transparent px-3.5 text-sm font-semibold shadow-sm print:hidden",
          badgeStyles.bg,
          badgeStyles.text,
        ].join(" ")}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: badgeStyles.dot }} />
        {status}
      </div>
    );
  }

  return (
    <div className="relative print:hidden" ref={rootRef}>
      <button
        type="button"
        id="inv-status-badge-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3.5 text-sm font-semibold shadow-sm outline-none transition",
          "hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-primary/25",
          badgeStyles.bg,
          badgeStyles.text,
        ].join(" ")}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: badgeStyles.dot }} />
        {status}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-labelledby="inv-status-badge-select"
          className="absolute right-0 z-[70] mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-[#ECECEC] bg-white py-1 text-sm shadow-lg"
        >
          {alternatives.map((opt) => (
            <li key={opt} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center px-3 py-2 text-left font-medium text-[#303973] hover:bg-[#F8F9FF]"
                onClick={() => {
                  onChangeStatus(invoiceId, opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Rasterize #invoice-paper to a multi-page A4 PDF (html2canvas scale 2 + jsPDF).
 */
async function exportInvoicePaperToPdf(element, invoiceNo) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const safeNo = String(invoiceNo || "invoice").replace(/[^\w.-]+/g, "_");
  pdf.save(`Invoice_${safeNo}.pdf`);
}

export default function InvoicePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { invoices, updateInvoiceStatus, updateInvoiceGreeting } = useInvoices();
  const { settings } = useSettings();
  const companyFrom = useMemo(() => getCompanyFromBlock(settings), [settings]);
  const logoMode = useMemo(() => getInvoiceLogoMode(settings), [settings]);
  const printTitleBackupRef = useRef(null);

  const invoice = useMemo(() => {
    const decoded = id ? decodeURIComponent(id) : "";
    if (decoded === ADD_INVOICE_DRAFT_VIEW_ID) {
      const draft = location.state?.draftInvoice;
      return draft && typeof draft === "object" ? draft : null;
    }
    return invoices.find((inv) => inv.id === decoded);
  }, [invoices, id, location.state]);
  const doc = useMemo(() => (invoice ? buildDocumentModel(invoice) : null), [invoice]);

  const copy = useMemo(() => (invoice ? resolveInvoiceCopy(invoice) : null), [invoice]);

  const [greetingEdit, setGreetingEdit] = useState("");

  useEffect(() => {
    if (!invoice) return;
    const saved = typeof invoice.greetingLine === "string" ? invoice.greetingLine.trim() : "";
    setGreetingEdit(saved || defaultInvoiceGreeting(invoice.client));
  }, [invoice?.id, invoice?.client, invoice?.greetingLine]);

  useEffect(() => {
    const onAfterPrint = () => {
      document.body.classList.remove("printing");
      if (printTitleBackupRef.current != null) {
        document.title = printTitleBackupRef.current;
        printTitleBackupRef.current = null;
      }
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  const billToEmail =
    invoice?.email ||
    `${(invoice?.client || "client").toLowerCase().replace(/\s+/g, ".")}@clients.invo-dash.app`;

  const billToAddressText = (invoice?.billingAddress || "").trim();

  const normalizedClient = (invoice?.client || "").trim().toLowerCase();
  const normalizedCompany = (invoice?.company || "").trim().toLowerCase();
  const showBillToCompany =
    Boolean(invoice?.company?.trim()) && normalizedCompany !== normalizedClient;

  const billToPhone = (invoice?.clientPhone || "").trim();

  const gstPercentDisplay =
    typeof invoice?.gstPercent === "number" && Number.isFinite(invoice.gstPercent)
      ? invoice.gstPercent
      : null;

  const termsDisplay = copy?.terms?.trim() || DEFAULT_TERMS_FALLBACK;

  const beginPrintToPdf = useCallback(() => {
    if (!invoice) return;
    printTitleBackupRef.current = document.title;
    document.title = `Invoice_${invoice.id}`;
    document.body.classList.add("printing");
    window.requestAnimationFrame(() => {
      window.print();
    });
  }, [invoice]);

  const handlePrint = useCallback(() => {
    beginPrintToPdf();
  }, [beginPrintToPdf]);

  const handleDownloadPdf = useCallback(async () => {
    const el = document.getElementById("invoice-paper");
    if (!el || !invoice) return;
    try {
      await exportInvoicePaperToPdf(el, invoice.id);
    } catch (err) {
      console.error(err);
      window.alert("Could not generate the PDF. Try Print and save as PDF instead.");
    }
  }, [invoice]);

  const isDraftPreview =
    Boolean(id && decodeURIComponent(id) === ADD_INVOICE_DRAFT_VIEW_ID) && Boolean(location.state?.draftInvoice);

  const persistGreeting = useCallback(() => {
    if (!invoice || isDraftPreview) return;
    updateInvoiceGreeting(invoice.id, greetingEdit);
  }, [invoice, greetingEdit, updateInvoiceGreeting, isDraftPreview]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = invoice ? `${invoice.id} — ${invoice.client}` : "Invoice";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
      } else {
        await navigator.clipboard.writeText(url);
        window.alert("Link copied to clipboard.");
      }
    } catch {
      /* user cancelled share */
    }
  }, [invoice]);

  if (!id) return <Navigate to="/invoices" replace />;
  const decodedId = decodeURIComponent(id);
  if (decodedId === ADD_INVOICE_DRAFT_VIEW_ID && !location.state?.draftInvoice) {
    return <Navigate to="/invoices" replace />;
  }
  if (!invoice || !doc || !copy) return <Navigate to="/invoices" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9FF] print:h-auto print:min-h-0 print:overflow-visible print:bg-white">
      <div className="invoice-preview-chrome print:hidden">
        <SideNavigation />
      </div>

      <div className="ml-[280px] flex h-screen min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:ml-0 print:h-auto print:overflow-visible">
        <div className="invoice-preview-chrome shrink-0 px-6 pt-6 print:hidden">
          <header className={previewPageHeaderShellClass}>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (isDraftPreview) {
                    navigate("/add-invoice");
                    return;
                  }
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/invoices");
                  }
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ECECEC] bg-white text-[#303973] shadow-sm transition hover:bg-[#F8F9FF] focus-visible:ring-2 focus-visible:ring-primary/25"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
              <h1 className="truncate text-[20px] font-medium leading-none text-text-primary">Invoice preview</h1>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
              <InvoiceStatusBadgeSelect
                readOnly={isDraftPreview}
                status={invoice.status}
                invoiceId={invoice.id}
                onChangeStatus={updateInvoiceStatus}
              />
              <ToolbarActions onDownloadPdf={handleDownloadPdf} onPrint={handlePrint} onShare={handleShare} />
            </div>
          </header>
        </div>

        <div className="h-[calc(100vh-7.25rem)] min-h-0 w-full overflow-x-auto overflow-y-auto px-6 pb-6 pt-2 print:h-auto print:overflow-visible print:px-0 print:pb-0 print:pt-0">
          <article
            id="invoice-paper"
            data-invoice-export="true"
            className={[
              "invoice-document invoice-print-paper box-border h-auto min-h-[297mm] overflow-visible rounded-2xl border border-[#E4E6F5] bg-white shadow-[0px_12px_40px_rgba(48,57,115,0.1)]",
              "w-[210mm] max-w-full mx-auto my-10 print:mx-0 print:my-0 print:w-[210mm] print:max-w-[210mm] print:rounded-none print:border-0 print:shadow-none",
              "[font-family:Inter,ui-sans-serif,system-ui,sans-serif] text-[#17171B]",
            ].join(" ")}
          >
            <div
              className={`invoice-print-exact-colors invoice-print-header invoice-print-blue-header relative ${headerGradient} px-6 py-6 md:px-10 md:py-7`}
            >
              <HeaderDecorOrbs />
              <div className="invoice-print-header-inner relative z-10 flex w-full flex-row flex-wrap items-start justify-between gap-6 md:gap-8">
                <div className="flex min-w-0 max-w-xl flex-1 flex-col items-start gap-2.5 text-left">
                  <div className="flex shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/5 p-0.5">
                    {logoMode === "custom" ? (
                      <img
                        src={settings.preferences.logoDataUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg object-contain"
                      />
                    ) : logoMode === "default" ? (
                      <InvoDashLogoMark variant="onBlue" className="h-16 w-16" title="Invo Dash" />
                    ) : (
                      <div
                        className="h-16 w-16 rounded-lg border border-dashed border-white/35 bg-white/5"
                        aria-hidden
                      />
                    )}
                  </div>
                  <p className="text-base font-bold uppercase tracking-[0.1em] text-white md:text-lg">Invo Dash</p>
                  <p className="text-[9px] font-normal uppercase tracking-[0.32em] text-white/75 md:text-[10px]">
                    Smart billing & collections
                  </p>
                  <div className="mt-1 w-full max-w-sm border-t border-white/10 pt-2 text-[10px] font-light leading-[1.4] text-white/80">
                    <p>{companyFrom.name}</p>
                    <p>{companyFrom.line1}</p>
                    <p>{companyFrom.line2}</p>
                    <p>{companyFrom.phone}</p>
                    <p>{companyFrom.email}</p>
                    <p className="tabular-nums tracking-wide">{companyFrom.gstin}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end self-start">
                  <p className="invoice-print-invoice-wordmark select-none text-3xl font-bold uppercase tracking-[0.14em] text-white md:text-4xl">
                    INVOICE
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-[#ECECEC] bg-white px-6 pb-8 pt-10 md:px-10 md:pb-8 md:pt-10">
              <div className="invoice-print-bill-meta-row flex w-full flex-row flex-wrap items-start justify-between gap-8 md:gap-10">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#71717A]">Bill To</p>
                  <div className="mt-3 space-y-2 text-[12px] font-normal leading-relaxed text-[#17171B]">
                    <p className="text-[15px] font-semibold text-[#17171B]">{invoice.client}</p>
                    {showBillToCompany ? <p>{invoice.company}</p> : null}
                    <p className="text-[#2F51A1]">{billToEmail}</p>
                    {billToAddressText ? (
                      <p className="whitespace-pre-line">{billToAddressText}</p>
                    ) : null}
                    {billToPhone ? <p className="tabular-nums text-[#17171B]">{billToPhone}</p> : null}
                  </div>
                </div>

                <dl className="w-full min-w-[11rem] max-w-[15rem] shrink-0 space-y-2.5 text-right sm:w-auto">
                  <div className="flex items-baseline justify-end gap-6 sm:justify-between">
                    <dt className="shrink-0 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71717A] sm:text-right md:text-[11px]">
                      No
                    </dt>
                    <dd className="text-right text-sm font-bold uppercase tracking-tight text-[#17171B] tabular-nums md:text-base">
                      {invoice.id}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-end gap-6 sm:justify-between">
                    <dt className="shrink-0 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71717A] sm:text-right md:text-[11px]">
                      Date
                    </dt>
                    <dd className="text-right text-sm font-bold tracking-tight text-[#17171B] tabular-nums md:text-base">
                      {formatHumanDate(invoice.issueDate || invoice.createdAt)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-end gap-6 sm:justify-between">
                    <dt className="shrink-0 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71717A] sm:text-right md:text-[11px]">
                      Due
                    </dt>
                    <dd className="text-right text-sm font-bold tracking-tight text-[#17171B] tabular-nums md:text-base">
                      {formatHumanDate(invoice.dueDate)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="invoice-print-greeting mt-6">
                <input
                  id="invoice-greeting-input"
                  type="text"
                  value={greetingEdit}
                  onChange={(e) => setGreetingEdit(e.target.value)}
                  onBlur={persistGreeting}
                  readOnly={isDraftPreview}
                  className="print:hidden w-full max-w-2xl border-b border-[#E4E6F5] bg-transparent py-1 text-[15px] font-normal leading-[1.65] text-zinc-600 outline-none focus:border-[#303973]/40 read-only:cursor-default read-only:opacity-90"
                  autoComplete="off"
                  aria-label="Invoice greeting"
                />
                <p className="hidden text-[15px] font-normal leading-[1.65] text-zinc-600 print:block">
                  {greetingEdit}
                </p>
              </div>
            </div>

            <div className="bg-white px-6 pb-10 md:px-10">
                <div className="mt-6">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="invoice-print-line-items w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="invoice-print-exact-colors bg-[#F0F3FC] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#303973]">
                        <th className="px-3 py-3 pr-4 font-bold">Qty</th>
                        <th className="px-3 py-3 pr-4 font-bold">Item description</th>
                        <th className="px-3 py-3 pr-4 text-right font-bold">Price</th>
                        <th className="px-3 py-3 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="invoice-print-table-body">
                      {doc.rows.map((row) => (
                        <tr
                          key={row.id}
                          className="break-inside-avoid text-[12px] leading-relaxed text-[#17171B] print:break-inside-avoid"
                        >
                          <td className="border-b border-[#F0F0F5] px-3 py-3 pr-4 align-top tabular-nums">{row.qty}</td>
                          <td className="border-b border-[#F0F0F5] px-3 py-3 pr-4 align-top">{row.description}</td>
                          <td className="border-b border-[#F0F0F5] px-3 py-3 pr-4 text-right align-top tabular-nums">
                            {formatINR(row.rate)}
                          </td>
                          <td className="border-b border-[#F0F0F5] px-3 py-3 text-right align-top tabular-nums">
                            {formatINR(row.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-print-summary-after-table mt-8">
                  <div className="invoice-print-summary flex justify-end print:break-inside-avoid">
                    <dl className="w-full max-w-[280px] space-y-2 text-sm">
                      <div className="flex items-baseline justify-between gap-6">
                        <dt className="text-[#71717A]">Subtotal</dt>
                        <dd className="font-semibold tabular-nums text-[#17171B]">{formatINR(doc.subtotal)}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-6">
                        <dt className="text-[#71717A]">
                          Tax{gstPercentDisplay != null ? ` (${gstPercentDisplay}%)` : ""}
                        </dt>
                        <dd className="font-semibold tabular-nums text-[#17171B]">{formatINR(doc.tax)}</dd>
                      </div>
                      <div className="invoice-print-exact-colors invoice-print-grand-total flex items-baseline justify-between gap-6 rounded-lg bg-[#303973] px-3 py-3 text-white">
                        <dt className="text-xs font-bold uppercase tracking-wide text-white">Grand total</dt>
                        <dd className="text-base font-bold tabular-nums tracking-tight text-white">
                          {formatINR(doc.grandTotal)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="invoice-footer mt-10 space-y-10 border-t border-transparent pt-2">
                <div className="border-t border-[#ECECEC] pt-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A]">Payment method</p>
                  <div className="mt-3 space-y-2 text-[12px] font-light leading-relaxed text-zinc-600">
                    <p>{companyFrom.bank}</p>
                    <p>{companyFrom.phone}</p>
                    <p className="break-all">{companyFrom.bankDetail}</p>
                  </div>
                </div>

                {copy.clientNotes ? (
                  <div className="border-t border-[#ECECEC] pt-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A]">Notes</p>
                    <p className="mt-3 whitespace-pre-line text-[12px] font-light leading-relaxed text-zinc-600">
                      {copy.clientNotes}
                    </p>
                  </div>
                ) : null}

                <div className="border-t border-[#ECECEC] pt-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A]">
                    Terms &amp; conditions
                  </p>
                  <p className="mt-3 whitespace-pre-line text-[12px] font-light leading-relaxed text-zinc-600">
                    {termsDisplay}
                  </p>
                </div>

                {copy.attachment ? (
                  <p className="text-[11px] font-normal leading-relaxed text-zinc-600">
                    <span className="font-medium text-zinc-600">Attachment reference: </span>
                    {copy.attachment}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
