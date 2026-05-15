import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { activityFeed as initialActivityFeed, invoiceRecords as initialInvoiceRecords } from "../../data/mockData";
import { getSortedOverdueInvoices } from "../utils/buildAiInsights.js";

const InvoiceContext = createContext(null);

function getNextInvoiceId(invoices) {
  const maxNumber = invoices.reduce((max, invoice) => {
    const match = invoice.id?.match(/\d+/);
    const number = match ? Number(match[0]) : 0;
    return number > max ? number : max;
  }, 0);

  return `INV-${String(maxNumber + 1).padStart(3, "0")}`;
}

function formatAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFeedTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState(initialInvoiceRecords);
  const [activityFeed, setActivityFeed] = useState(initialActivityFeed);
  /** After bulk overdue reminder send from header/greeting: red badge reads 0 until invoice data changes. */
  const [bulkOverdueRemindersAcknowledged, setBulkOverdueRemindersAcknowledged] = useState(false);
  /** Canonical AI insight ids (see buildAiInsights) hidden until invoice data resets. */
  const [dismissedAiInsightIds, setDismissedAiInsightIds] = useState([]);

  const resetReminderAckState = useCallback(() => {
    setBulkOverdueRemindersAcknowledged(false);
    setDismissedAiInsightIds([]);
  }, []);

  const addInvoice = ({
    client,
    company,
    billingContact,
    amount,
    dueDate,
    issueDate,
    notes,
    clientNotes,
    terms,
    greetingLine,
    attachmentReference,
    email,
    clientPhone,
    billingAddress,
    lineItems,
    subtotal,
    taxAmount,
    gstPercent,
    priority,
    currency,
    paymentTerms,
  }) => {
    const id = getNextInvoiceId(invoices);
    const normalizedAmount = Number(amount) || 0;
    const createdAt = new Date().toISOString();
    const issue = issueDate || createdAt.slice(0, 10);

    const resolvedClientNotes =
      typeof clientNotes === "string"
        ? clientNotes.trim()
        : typeof notes === "string"
          ? notes.trim()
          : "";
    const resolvedTerms = typeof terms === "string" ? terms.trim() : "";

    const resolvedGreeting =
      typeof greetingLine === "string" && greetingLine.trim() ? greetingLine.trim() : undefined;

    const resolvedPriority =
      priority === "High" || priority === "Medium" || priority === "Low" ? priority : "Medium";

    const allowedCurrency = ["INR", "USD", "EUR"];
    const resolvedCurrency = allowedCurrency.includes(currency) ? currency : "INR";

    const allowedPaymentTerms = ["net7", "net15", "net30", "due"];
    const resolvedPaymentTerms = allowedPaymentTerms.includes(paymentTerms)
      ? paymentTerms
      : "net7";

    const newInvoice = {
      id,
      client,
      company: company || "Client Account",
      amount: normalizedAmount,
      dueDate,
      issueDate: issue,
      clientNotes: resolvedClientNotes,
      terms: resolvedTerms,
      ...(resolvedGreeting ? { greetingLine: resolvedGreeting } : {}),
      ...(attachmentReference?.trim() ? { attachmentReference: attachmentReference.trim() } : {}),
      createdAt,
      priority: resolvedPriority,
      currency: resolvedCurrency,
      paymentTerms: resolvedPaymentTerms,
      status: "Pending",
      ...(email ? { email: email.trim() } : {}),
      ...(clientPhone?.trim() ? { clientPhone: clientPhone.trim() } : {}),
      ...(typeof billingContact === "string" && billingContact.trim()
        ? { billingContact: billingContact.trim() }
        : {}),
      ...(billingAddress?.trim() ? { billingAddress: billingAddress.trim() } : {}),
      ...(Array.isArray(lineItems) && lineItems.length > 0 ? { lineItems } : {}),
      ...(typeof subtotal === "number" ? { subtotal } : {}),
      ...(typeof taxAmount === "number" ? { taxAmount } : {}),
      ...(typeof gstPercent === "number" && Number.isFinite(gstPercent) ? { gstPercent } : {}),
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    resetReminderAckState();

    setActivityFeed((prev) => [
      {
        id: `af-${Date.now()}`,
        message: `New Invoice Created ${id} for ${client} (${formatAmount(normalizedAmount)})`,
        time: `Today, ${formatFeedTime()}`,
      },
      ...prev,
    ]);

    return newInvoice;
  };

  const updateInvoiceStatus = useCallback((invoiceId, status) => {
    const allowed = ["Pending", "Paid", "Overdue"];
    if (!allowed.includes(status)) return;

    resetReminderAckState();

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status } : inv))
    );

    setActivityFeed((prev) => [
      {
        id: `af-${Date.now()}`,
        message: `${invoiceId} marked as ${status}`,
        time: `Today, ${formatFeedTime()}`,
      },
      ...prev,
    ]);
  }, [resetReminderAckState]);

  const updateInvoiceGreeting = useCallback((invoiceId, greetingLine) => {
    const trimmed = typeof greetingLine === "string" ? greetingLine.trim() : "";
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, greetingLine: trimmed || undefined } : inv
      )
    );
  }, []);

  const metrics = useMemo(() => {
    const paidAmount = invoices
      .filter((invoice) => invoice.status === "Paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const pendingAmount = invoices
      .filter((invoice) => invoice.status !== "Paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const overdueAmount = invoices
      .filter((invoice) => invoice.status === "Overdue")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
    };
  }, [invoices]);

  const overdueReminderCount = useMemo(() => getSortedOverdueInvoices(invoices).length, [invoices]);

  const pendingRemindersCount = bulkOverdueRemindersAcknowledged ? 0 : overdueReminderCount;

  const acknowledgeRemindersSent = useCallback((opts = {}) => {
    const n = typeof opts.recipientCount === "number" ? opts.recipientCount : null;
    const dismissIds = Array.isArray(opts.dismissInsightIds)
      ? opts.dismissInsightIds.filter((id) => typeof id === "string" && id.length > 0)
      : [];
    const acknowledgeBulkBadge = Boolean(opts.acknowledgeBulkOverdueBadge);

    if (acknowledgeBulkBadge) {
      setBulkOverdueRemindersAcknowledged(true);
    }
    if (dismissIds.length > 0) {
      setDismissedAiInsightIds((prev) => [...new Set([...prev, ...dismissIds])]);
    }

    const message =
      n != null && n > 0
        ? `Reminders sent to ${n} account${n === 1 ? "" : "s"}`
        : "Reminders sent for selected overdue accounts";
    setActivityFeed((prev) => [
      {
        id: `af-${Date.now()}`,
        message,
        time: `Today, ${formatFeedTime()}`,
      },
      ...prev,
    ]);
  }, []);

  const value = useMemo(
    () => ({
      invoices,
      activityFeed,
      addInvoice,
      updateInvoiceStatus,
      updateInvoiceGreeting,
      metrics,
      overdueReminderCount,
      pendingRemindersCount,
      bulkOverdueRemindersAcknowledged,
      dismissedAiInsightIds,
      acknowledgeRemindersSent,
    }),
    [
      invoices,
      activityFeed,
      metrics,
      overdueReminderCount,
      pendingRemindersCount,
      bulkOverdueRemindersAcknowledged,
      dismissedAiInsightIds,
      updateInvoiceStatus,
      updateInvoiceGreeting,
      acknowledgeRemindersSent,
    ],
  );

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
}

export function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoices must be used within InvoiceProvider");
  }
  return context;
}
