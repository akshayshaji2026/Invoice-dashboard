import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  IndianRupee,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ADD_INVOICE_DRAFT_VIEW_ID } from "../constants/invoiceDraftPreview.js";
import MainLayout from "../layouts/MainLayout.jsx";
import { useInvoices } from "../context/InvoiceContext.jsx";
import { useLayoutScroll, useScrollDepth, useSetCondensedHeader } from "../context/LayoutScrollContext.jsx";
import { useSettings, getCompanyFromBlock } from "../context/SettingsContext.jsx";
import { defaultInvoiceGreeting } from "../utils/invoiceGreeting.js";
import { CustomDropdown, labelClass } from "../../components/ui/CustomDropdown.jsx";
import { FormDateInput } from "../../components/ui/FormDateInput.jsx";

const PRIORITY_OPTIONS = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "net7", label: "Net 7 Days" },
  { value: "net15", label: "Net 15 Days" },
  { value: "net30", label: "Net 30 Days" },
  { value: "due", label: "Due on Receipt" },
];

function getNextInvoiceId(invoices) {
  const maxNumber = invoices.reduce((max, invoice) => {
    const match = invoice.id?.match(/\d+/);
    const number = match ? Number(match[0]) : 0;
    return number > max ? number : max;
  }, 0);

  return `INV-${String(maxNumber + 1).padStart(3, "0")}`;
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-[16px] border border-[#ECECEC] bg-white p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.08)]">
      <h3 className="mb-4 text-[16px] font-semibold text-[#17171B]">{title}</h3>
      {children}
    </section>
  );
}

const defaultLine = () => ({
  id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  description: "",
  qty: 1,
  rate: 0,
});

function addDaysIso(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10);
}

/** Main scroll container: past this `scrollTop`, mirror Preview/Save/Send in the header (`addInvoiceFormActionsInView` → false). */
const ADD_INVOICE_SCROLL_HEADER_THRESHOLD_PX = 150;

/** Body Preview / Save: `border-slate-200`, no blue focus ring. */
const addInvoiceActionRowSecondaryBtnClass =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-[#303973] shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:bg-[#F9FAFB] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:text-[#B1B1C2]";

const addInvoiceActionRowPrimaryBtnClass =
  "inline-flex h-10 items-center gap-2 rounded-xl bg-[#2F51A1] px-4 text-sm font-normal text-white shadow-sm transition hover:bg-[#254278] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 disabled:cursor-not-allowed disabled:bg-[#9CA6C9] disabled:text-white";

const addInvoiceHeaderIconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-0 bg-transparent p-0 text-[#828BB9] transition hover:bg-slate-100 hover:text-[#575E78] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 disabled:cursor-not-allowed disabled:text-[#C5C9D8]";

const addInvoiceHeaderSendBtnClass =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#2F51A1] px-3.5 text-xs font-normal text-white shadow-sm transition hover:bg-[#254278] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-[#9CA6C9] disabled:text-white";

export default function AddInvoicePage() {
  const navigate = useNavigate();
  const { invoices, addInvoice } = useInvoices();
  const { settings } = useSettings();
  const companyFrom = useMemo(() => getCompanyFromBlock(settings), [settings]);
  const { isScrolled } = useScrollDepth();
  const { mainScrollRef, setAddInvoiceFormActionsInView } = useLayoutScroll();
  const setCondensedHeader = useSetCondensedHeader();
  /** Scroll listener on `mainScrollRef` only (no IntersectionObserver). */
  const actionRowRef = useRef(null);

  const [extraClients, setExtraClients] = useState([]);
  const [showNewClientRow, setShowNewClientRow] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState("");

  const clientOptions = useMemo(() => {
    const fromDb = invoices.map((i) => i.client);
    return [...new Set([...fromDb, ...extraClients])].filter(Boolean).sort();
  }, [invoices, extraClients]);

  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reference, setReference] = useState("");
  const [formData, setFormData] = useState({
    client: clientOptions[0] ?? "",
    company: "",
    email: "",
    clientPhone: "",
    gst: "",
    billingAddress: "",
    amount: "",
    dueDate: "",
    notes: "",
    priority: "Medium",
    currency: "INR",
    paymentTerms: "net7",
    terms:
      "Payment is due within the terms listed above. Late payments may incur penalties.",
  });
  const [lines, setLines] = useState([defaultLine(), defaultLine()]);
  const [gstPercent, setGstPercent] = useState("18");
  const [payBank, setPayBank] = useState(true);
  const [payUpi, setPayUpi] = useState(false);
  const [payRazorpay, setPayRazorpay] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentNote, setAttachmentNote] = useState("");
  const [attachDragOver, setAttachDragOver] = useState(false);
  const attachmentInputRef = useRef(null);
  const [greeting, setGreeting] = useState(() => defaultInvoiceGreeting(clientOptions[0] ?? ""));

  const addAttachmentFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) => f instanceof File);
    if (!files.length) return;
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        file,
      })),
    ]);
  }, []);

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const buildAttachmentReference = useCallback(() => {
    const names = attachments.map((a) => a.name);
    const note = attachmentNote.trim();
    const parts = [...names];
    if (note) parts.push(note);
    const combined = parts.join(", ").trim();
    return combined || undefined;
  }, [attachments, attachmentNote]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const defaultsAppliedRef = useRef(false);
  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    defaultsAppliedRef.current = true;
    const today = new Date().toISOString().slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      currency: settings.preferences.currency,
      dueDate: prev.dueDate || addDaysIso(today, settings.preferences.defaultDueDays),
    }));
  }, [settings.preferences.currency, settings.preferences.defaultDueDays]);

  const nextInvoiceId = useMemo(() => getNextInvoiceId(invoices), [invoices]);

  const lineTotals = useMemo(() => {
    return lines.map((line) => {
      const qty = Number(line.qty) || 0;
      const rate = Number(line.rate) || 0;
      return qty * rate;
    });
  }, [lines]);

  const subtotal = lineTotals.reduce((a, b) => a + b, 0) || Number(formData.amount) || 0;
  const gstRate = Number(gstPercent) / 100;
  const gstAmount = Math.round(subtotal * gstRate);
  const grandTotal = subtotal + gstAmount;

  /** Preview disabled when invoice total is not positive (per product spec). */
  const previewEnabled = grandTotal > 0;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onClientChange = useCallback(
    (client) => {
      const inv = invoices.find((i) => i.client === client);
      setGreeting(defaultInvoiceGreeting(client));
      setFormData((prev) => ({
        ...prev,
        client,
        ...(inv
          ? {
              ...(inv.company ? { company: inv.company } : {}),
              clientPhone: inv.clientPhone?.trim() ? inv.clientPhone : "",
              ...(inv.priority === "High" || inv.priority === "Medium" || inv.priority === "Low"
                ? { priority: inv.priority }
                : {}),
            }
          : {
              company: "",
              clientPhone: "",
            }),
      }));
    },
    [invoices],
  );

  const commitNewClientFromDraft = useCallback(() => {
    const name = newClientDraft.trim();
    if (!name) return;
    setExtraClients((prev) => (prev.includes(name) ? prev : [...prev, name]));
    onClientChange(name);
    setNewClientDraft("");
    setShowNewClientRow(false);
  }, [newClientDraft, onClientChange]);

  const clientDropdownOptions = useMemo(() => {
    if (clientOptions.length === 0) {
      return [{ value: "", label: "No clients available" }];
    }
    return clientOptions.map((c) => ({ value: c, label: c }));
  }, [clientOptions]);

  const persistInvoice = () => {
    if (!formData.client) return null;
    const amountValue =
      grandTotal > 0 ? grandTotal : Number(formData.amount) || 0;
    if (!amountValue || amountValue <= 0) return null;
    const due = formData.dueDate || issueDate;
    if (!due) return null;

    const selected = invoices.find((invoice) => invoice.client === formData.client);
    const persistedLines = lines
      .filter((line) => (line.description || "").trim() || Number(line.rate) || Number(line.qty))
      .map((line) => ({
        description: (line.description || "").trim() || "Line item",
        qty: Number(line.qty) || 0,
        rate: Number(line.rate) || 0,
      }))
      .filter((line) => line.qty * line.rate !== 0);
    const lineSubtotal =
      persistedLines.length > 0 ? persistedLines.reduce((s, l) => s + l.qty * l.rate, 0) : subtotal;

    return addInvoice({
      client: formData.client,
      company: formData.company || selected?.company || "Client Account",
      amount: amountValue,
      dueDate: due,
      issueDate,
      greetingLine: greeting.trim() || undefined,
      clientNotes: formData.notes?.trim() || "",
      terms: formData.terms?.trim() || "",
      attachmentReference: buildAttachmentReference(),
      email: formData.email?.trim() || undefined,
      clientPhone: formData.clientPhone?.trim() || undefined,
      billingAddress: formData.billingAddress?.trim() || undefined,
      lineItems: persistedLines.length ? persistedLines : undefined,
      subtotal: persistedLines.length ? lineSubtotal : subtotal,
      taxAmount: gstAmount,
      gstPercent: Number(gstPercent),
      priority: formData.priority,
      currency: formData.currency,
      paymentTerms: formData.paymentTerms,
    });
  };

  const buildDraftInvoice = useCallback(() => {
    const amountValue = grandTotal > 0 ? grandTotal : Number(formData.amount) || 0;
    const due = formData.dueDate || issueDate;
    const selected = invoices.find((invoice) => invoice.client === formData.client);
    const persistedLines = lines
      .filter((line) => (line.description || "").trim() || Number(line.rate) || Number(line.qty))
      .map((line) => ({
        description: (line.description || "").trim() || "Line item",
        qty: Number(line.qty) || 0,
        rate: Number(line.rate) || 0,
      }))
      .filter((line) => line.qty * line.rate !== 0);
    const lineSubtotal =
      persistedLines.length > 0 ? persistedLines.reduce((s, l) => s + l.qty * l.rate, 0) : subtotal;

    return {
      id: nextInvoiceId,
      client: formData.client,
      company: formData.company || selected?.company || "Client Account",
      amount: amountValue,
      dueDate: due,
      issueDate,
      status: "Pending",
      greetingLine: greeting.trim() || undefined,
      clientNotes: formData.notes?.trim() || "",
      terms: formData.terms?.trim() || "",
      ...(buildAttachmentReference()
        ? { attachmentReference: buildAttachmentReference() }
        : {}),
      ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
      ...(formData.clientPhone?.trim() ? { clientPhone: formData.clientPhone.trim() } : {}),
      ...(formData.billingAddress?.trim() ? { billingAddress: formData.billingAddress.trim() } : {}),
      ...(persistedLines.length ? { lineItems: persistedLines } : {}),
      subtotal: persistedLines.length ? lineSubtotal : subtotal,
      taxAmount: gstAmount,
      gstPercent: Number(gstPercent),
      priority: formData.priority,
      currency: formData.currency,
      paymentTerms: formData.paymentTerms,
      createdAt: new Date().toISOString(),
    };
  }, [
    grandTotal,
    formData,
    issueDate,
    invoices,
    lines,
    greeting,
    attachmentNote,
    attachments,
    buildAttachmentReference,
    gstAmount,
    gstPercent,
    nextInvoiceId,
  ]);

  const handlePreview = useCallback(() => {
    if (!previewEnabled) return;
    navigate(`/invoices/view/${encodeURIComponent(ADD_INVOICE_DRAFT_VIEW_ID)}`, {
      state: { draftInvoice: buildDraftInvoice() },
    });
  }, [previewEnabled, navigate, buildDraftInvoice]);

  const handleSendInvoice = (event) => {
    event.preventDefault();
    setIsSaving(true);
    const created = persistInvoice();
    if (!created) {
      setIsSaving(false);
      return;
    }
    setIsSaved(true);
    setTimeout(() => navigate("/invoices"), 1500);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    const created = persistInvoice();
    if (!created) {
      setIsSaving(false);
      return;
    }
    setIsSaved(true);
    setTimeout(() => navigate("/invoices"), 1500);
  };

  const headerActionsRef = useRef({
    handleSaveDraft,
    handleSendInvoice,
    handlePreview,
  });
  headerActionsRef.current = { handleSaveDraft, handleSendInvoice, handlePreview };

  /** Raw `onscroll` on `mainScrollRef` — no IntersectionObserver. */
  useLayoutEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let el = null;

    const attach = () => {
      el = mainScrollRef.current;
      if (!el) return false;

      el.onscroll = () => {
        const root = mainScrollRef.current;
        if (!root) return;
        setAddInvoiceFormActionsInView(
          root.scrollTop < ADD_INVOICE_SCROLL_HEADER_THRESHOLD_PX,
        );
      };
      el.onscroll();
      return true;
    };

    if (!attach()) {
      rafId = requestAnimationFrame(() => {
        if (!cancelled) attach();
      });
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (el) el.onscroll = null;
      setAddInvoiceFormActionsInView(true);
    };
  }, [mainScrollRef, setAddInvoiceFormActionsInView]);

  useEffect(() => {
    const disabled = isSaving || isSaved;
    const previewLocked = !previewEnabled;

    setCondensedHeader(
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => headerActionsRef.current.handlePreview()}
          disabled={disabled}
          title={
            disabled
              ? undefined
              : previewLocked
                ? "Fill in line items and amounts to preview"
                : "Preview invoice"
          }
          className={addInvoiceHeaderIconBtnClass}
          aria-label={previewLocked && !disabled ? "Preview invoice — add line totals first" : "Preview invoice"}
        >
          <Eye
            className={`h-4 w-4 shrink-0 ${previewLocked && !disabled ? "opacity-30" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() => headerActionsRef.current.handleSaveDraft()}
          disabled={disabled}
          className={addInvoiceHeaderIconBtnClass}
          aria-label="Save draft"
        >
          <Save className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => headerActionsRef.current.handleSendInvoice(e)}
          disabled={disabled}
          className={addInvoiceHeaderSendBtnClass}
        >
          <Send className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2} aria-hidden />
          Send Invoice
        </button>
      </div>,
    );
    return () => setCondensedHeader(null);
  }, [setCondensedHeader, isSaving, isSaved, previewEnabled]);

  const updateLine = (id, field, value) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  const addLine = () => setLines((prev) => [...prev, defaultLine()]);
  const removeLine = (id) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));

  return (
    <>
      <MainLayout title="Invoices" showAddInvoice={false}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              aria-hidden={isScrolled}
              className={`inline-flex w-fit items-center gap-2 text-sm font-medium text-[#303973] transition-opacity duration-300 hover:text-primary ${
                isScrolled ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div
              ref={actionRowRef}
              data-add-invoice-action-row
              className="min-h-[1px] min-w-0"
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={!previewEnabled || isSaving || isSaved}
                  className={addInvoiceActionRowSecondaryBtnClass}
                >
                  <Eye className="h-4 w-4 shrink-0 text-[#575E78]" strokeWidth={2} aria-hidden />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving || isSaved}
                  className={addInvoiceActionRowSecondaryBtnClass}
                >
                  <Save className="h-4 w-4 shrink-0 text-[#575E78]" strokeWidth={2} aria-hidden />
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleSendInvoice}
                  disabled={isSaving || isSaved}
                  className={addInvoiceActionRowPrimaryBtnClass}
                >
                  <Send className="h-4 w-4 shrink-0 text-white" strokeWidth={2} aria-hidden />
                  Send Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 lg:col-span-8 min-w-0 space-y-6">
              <FormSection title="Your business (from Settings)">
                <p className="mb-3 text-xs text-[#828BB9]">
                  Edit in{" "}
                  <Link to="/settings#company" className="font-medium text-[#2F51A1] hover:underline">
                    Settings → Company details
                  </Link>
                  . This block mirrors the invoice header &ldquo;From&rdquo; section.
                </p>
                <div className="space-y-1 rounded-lg border border-[#ECECEC] bg-[#FAFAFF] px-3 py-3 text-xs leading-relaxed text-[#575E78]">
                  <p className="font-semibold text-[#303973]">{companyFrom.name}</p>
                  <p>{companyFrom.line1}</p>
                  <p>{companyFrom.line2}</p>
                  <p>{companyFrom.phone}</p>
                  <p className="text-[#2F51A1]">{companyFrom.email}</p>
                  <p className="tabular-nums">{companyFrom.gstin}</p>
                </div>
              </FormSection>

              <FormSection title="Invoice details">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Invoice number</span>
                    <div className="flex h-11 items-center rounded-xl border border-[#ECECEC] bg-[#F8F9FF] px-4 text-sm font-semibold text-primary shadow-[0px_1px_8px_rgba(54,76,215,0.1)] font-[Inter,ui-sans-serif,system-ui,sans-serif]">
                      {nextInvoiceId}
                    </div>
                  </label>
                  <label className="min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Issue date</span>
                    <FormDateInput value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </label>
                  <label className="min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Due date</span>
                    <FormDateInput
                      value={formData.dueDate}
                      onChange={(e) => handleChange("dueDate", e.target.value)}
                    />
                  </label>
                  <label className="min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Currency</span>
                    <CustomDropdown
                      value={formData.currency}
                      onChange={(v) => handleChange("currency", v)}
                      options={CURRENCY_OPTIONS}
                      className="w-full min-w-0"
                    />
                  </label>
                  <div className="min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Payment terms</span>
                    <CustomDropdown
                      value={formData.paymentTerms}
                      onChange={(v) => handleChange("paymentTerms", v)}
                      options={PAYMENT_TERMS_OPTIONS}
                      className="w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Priority</span>
                    <CustomDropdown
                      value={formData.priority}
                      onChange={(v) => handleChange("priority", v)}
                      options={PRIORITY_OPTIONS}
                      className="w-full min-w-0"
                    />
                  </div>
                  <label className="min-w-0 sm:col-span-1">
                    <span className={`mb-2 block ${labelClass}`}>Reference (optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. PO-45892, contract ref, or project code"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white px-4 text-sm font-medium text-[#1C1C1C] placeholder:text-sm placeholder:font-medium placeholder:text-[#B1B1C2] shadow-[0px_1px_8px_rgba(54,76,215,0.1)] transition-colors hover:bg-[#F5F7FF]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 font-[Inter,ui-sans-serif,system-ui,sans-serif]"
                    />
                  </label>
                  <div
                    className="hidden min-h-0 sm:block"
                    aria-hidden="true"
                  />
                </div>
              </FormSection>

              <FormSection title="Greeting">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">
                    Opening line (shown on the invoice)
                  </span>
                  <input
                    type="text"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder='e.g. Dear Zomato,'
                    className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2]"
                    autoComplete="off"
                  />
                </label>
              </FormSection>

              <FormSection title="Bill to">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className={`mb-2 block ${labelClass}`}>Client</span>
                    <CustomDropdown
                      value={formData.client}
                      onChange={onClientChange}
                      options={clientDropdownOptions}
                      placeholder="Select client"
                      className="min-w-0 w-full"
                      disabled={clientOptions.length === 0}
                      menuFooter={(close) => (
                        <button
                          type="button"
                          className="relative z-10 w-full cursor-pointer border-t border-[#F0F0F0] px-4 py-3 text-left text-sm font-semibold text-[#2F51A1] transition hover:bg-[#F5F7FF] active:bg-[#EEF2FF]"
                          onClick={() => {
                            close();
                            setShowNewClientRow(true);
                            setNewClientDraft("");
                          }}
                        >
                          ＋ Add New Client
                        </button>
                      )}
                    />
                    {showNewClientRow ? (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={newClientDraft}
                          onChange={(e) => setNewClientDraft(e.target.value)}
                          placeholder="New client name"
                          className="h-11 min-w-0 flex-1 rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2]"
                          autoComplete="organization"
                        />
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={commitNewClientFromDraft}
                            className="h-11 rounded-xl bg-[#2F51A1] px-4 text-sm font-medium text-white transition hover:bg-[#254278]"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewClientRow(false);
                              setNewClientDraft("");
                            }}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#303973] transition hover:bg-[#F9FAFB]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">Company</span>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2]"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">
                      Email address
                    </span>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2]"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">Phone (optional)</span>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.clientPhone}
                      onChange={(e) => handleChange("clientPhone", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2] tabular-nums"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">
                      GST (optional)
                    </span>
                    <input
                      type="text"
                      placeholder="GSTIN"
                      value={formData.gst}
                      onChange={(e) => handleChange("gst", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white px-3 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2]"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">
                      Billing address
                    </span>
                    <textarea
                      rows={3}
                      placeholder="Full billing address"
                      value={formData.billingAddress}
                      onChange={(e) => handleChange("billingAddress", e.target.value)}
                      className="w-full rounded-xl border border-[#ECECEC] bg-white px-3 py-2.5 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2] resize-none"
                    />
                  </label>
                </div>
              </FormSection>

              <FormSection title="Line items">
                <div className="overflow-hidden rounded-xl border border-[#ECECEC]">
                  <div className="grid grid-cols-[1fr_72px_120px_120px] gap-2 bg-[#EFEFFA] px-3 py-2 text-[11px] font-medium text-[#575E78] sm:grid-cols-[1fr_80px_120px_140px]">
                    <div>Description</div>
                    <div className="text-center">Qty</div>
                    <div className="text-right">Rate (₹)</div>
                    <div className="text-right">Total (₹)</div>
                  </div>
                  {lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="grid grid-cols-[1fr_72px_120px_120px] items-center gap-2 border-t border-[#F0F0F0] px-3 py-2 sm:grid-cols-[1fr_80px_120px_140px]"
                    >
                      <input
                        type="text"
                        placeholder={`Item ${idx + 1}`}
                        value={line.description}
                        onChange={(e) => updateLine(line.id, "description", e.target.value)}
                        className="rounded-lg border border-[#ECECEC] px-2 py-1.5 text-sm text-[#1C1C1C]"
                      />
                      <input
                        type="number"
                        min="0"
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, "qty", e.target.value)}
                        className="rounded-lg border border-[#ECECEC] px-2 py-1.5 text-center text-sm text-[#1C1C1C]"
                      />
                      <input
                        type="number"
                        min="0"
                        value={line.rate}
                        onChange={(e) => updateLine(line.id, "rate", e.target.value)}
                        className="rounded-lg border border-[#ECECEC] px-2 py-1.5 text-right text-sm text-[#1C1C1C]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-medium text-[#1C1C1C]">
                          ₹{lineTotals[idx].toLocaleString("en-IN")}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="rounded-lg p-1.5 text-[#B1B1C2] hover:bg-[#FFF1F1] hover:text-[#CE2222] transition"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Add line
                </button>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">
                    Or enter total amount (if not using lines)
                  </span>
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#828BB9]" />
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white pl-10 pr-3 text-sm text-[#1C1C1C]"
                      value={formData.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                    />
                  </div>
                </label>
              </FormSection>

              <FormSection title="Attachments">
                <div
                  className={[
                    "flex flex-col gap-3 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
                    attachDragOver
                      ? "border-[#2F51A1] bg-[#F5F7FF]"
                      : "border-[#D6DAF0] bg-[#FAFBFF]",
                  ].join(" ")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setAttachDragOver(true);
                  }}
                  onDragLeave={() => setAttachDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAttachDragOver(false);
                    addAttachmentFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addAttachmentFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="mx-auto flex flex-col items-center gap-2 rounded-lg p-2 text-center transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25"
                  >
                    <Paperclip className="h-6 w-6 text-[#A8B1E1]" aria-hidden />
                    <span className="text-sm text-[#717BBC]">
                      Drag files here or click to browse
                    </span>
                    <span className="text-xs text-[#B1B1C2]">PDF, images, or documents</span>
                  </button>

                  {attachments.length > 0 ? (
                    <ul className="mx-auto w-full max-w-md space-y-2 text-left">
                      {attachments.map((att) => (
                        <li
                          key={att.id}
                          className="flex items-center gap-2 rounded-xl border border-[#ECECEC] bg-white px-3 py-2 shadow-[0px_1px_2px_rgba(48,57,115,0.04)]"
                        >
                          <Paperclip className="h-4 w-4 shrink-0 text-[#828BB9]" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#303973]">
                            {att.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#828BB9] transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                            aria-label={`Remove ${att.name}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <input
                    type="text"
                    placeholder="Optional: document name or URL reference"
                    value={attachmentNote}
                    onChange={(e) => setAttachmentNote(e.target.value)}
                    className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2] focus:border-slate-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(47,81,161,0.14)]"
                  />
                </div>
              </FormSection>

              <FormSection title="Notes & terms">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">Notes</span>
                  <textarea
                    rows={4}
                    placeholder="Notes to client..."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="w-full rounded-xl border border-[#ECECEC] bg-white px-3 py-2.5 text-sm text-[#1C1C1C] resize-none"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-medium text-[#B1B1C2]">Terms</span>
                  <textarea
                    rows={3}
                    value={formData.terms}
                    onChange={(e) => handleChange("terms", e.target.value)}
                    className="w-full rounded-xl border border-[#ECECEC] bg-white px-3 py-2.5 text-sm text-[#1C1C1C] resize-none"
                  />
                </label>
              </FormSection>
            </div>

            <aside className="col-span-12 lg:col-span-4 min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div
                className="rounded-[16px] p-[1px] shadow-[0px_1px_8px_rgba(54,76,215,0.12)]"
                style={{ background: "linear-gradient(135deg, #4A34C6 0%, #9A3BDE 100%)" }}
              >
                <div
                  className="rounded-[15px] px-4 py-4 text-white"
                  style={{
                    background: "linear-gradient(135deg, rgba(74,52,198,0.95) 0%, rgba(154,59,222,0.92) 100%)",
                  }}
                >
                  <p className="text-[13px] font-semibold leading-snug">
                    AI suggestion
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/95">
                    Add a 2% early payment discount to improve on-time collection. Clients who receive
                    discounts pay faster on average.
                  </p>
                </div>
              </div>

              <section className="rounded-[16px] border border-[#ECECEC] bg-white p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.08)]">
                <h3 className="mb-4 text-[16px] font-semibold text-[#17171B]">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#6E7191]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#1C1C1C]">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#6E7191]">GST</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        className="h-9 rounded-lg border border-[#ECECEC] px-2 text-xs text-[#1C1C1C]"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                      </select>
                      <span className="font-medium text-[#1C1C1C]">
                        ₹{gstAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-[#F0F0F0] pt-3 flex justify-between">
                    <span className="font-semibold text-[#17171B]">Total</span>
                    <span className="text-lg font-semibold text-primary">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-[16px] border border-[#ECECEC] bg-white p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.08)]">
                <h3 className="mb-4 text-[16px] font-semibold text-[#17171B]">Payment options</h3>
                <div className="space-y-3 text-sm text-[#303973]">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={payBank}
                      onChange={(e) => setPayBank(e.target.checked)}
                      className="h-4 w-4 rounded border-[#ECECEC] text-primary focus:ring-primary"
                    />
                    Bank Transfer (NEFT/RTGS)
                  </label>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={payUpi}
                      onChange={(e) => setPayUpi(e.target.checked)}
                      className="h-4 w-4 rounded border-[#ECECEC] text-primary focus:ring-primary"
                    />
                    UPI
                  </label>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={payRazorpay}
                      onChange={(e) => setPayRazorpay(e.target.checked)}
                      className="h-4 w-4 rounded border-[#ECECEC] text-primary focus:ring-primary"
                    />
                    Razorpay Link
                  </label>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </MainLayout>

      {isSaved ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#17171B] px-4 py-3 text-sm text-white shadow-[0px_12px_30px_rgba(23,23,27,0.25)]">
          <CheckCircle2 className="h-4 w-4 text-[#84E1BC]" />
          Invoice saved. Redirecting to dashboard...
        </div>
      ) : null}
    </>
  );
}
