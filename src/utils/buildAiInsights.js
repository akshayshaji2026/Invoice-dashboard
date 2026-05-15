import { formatInvoiceINR, getPriorityFromInvoice } from "../../components/invoiceTableShared.jsx";

function invoiceNum(id) {
  const m = String(id).match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function priorityRank(inv) {
  const p = getPriorityFromInvoice(inv);
  if (p === "High") return 0;
  if (p === "Medium") return 1;
  return 2;
}

/** High explicit/derived priority first, then newer invoice ids */
function compareAttentionInvoices(a, b) {
  const pr = priorityRank(a) - priorityRank(b);
  if (pr !== 0) return pr;
  return invoiceNum(b.id) - invoiceNum(a.id);
}

/** Single source of truth for overdue invoices used by AI Insights + summary stats. */
export function getSortedOverdueInvoices(invoices) {
  if (!Array.isArray(invoices) || invoices.length === 0) return [];
  return invoices.filter((i) => i.status === "Overdue").sort(compareAttentionInvoices);
}

/**
 * Dashboard AI insights: ordered high → medium → low.
 * Pending / overdue ordering respects explicit `priority` on invoices (High first).
 */
export function buildAiInsights(invoices, sortedOverdue = null) {
  if (!Array.isArray(invoices) || invoices.length === 0) return [];

  const overdue = sortedOverdue ?? getSortedOverdueInvoices(invoices);
  const pending = invoices
    .filter((i) => i.status === "Pending")
    .sort(compareAttentionInvoices);

  const out = [];

  if (overdue.length > 0) {
    const totalAmount = overdue.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const idList = overdue.map((i) => i.id).join(", ");
    out.push({
      id: "ai-overdue-summary",
      title: `${overdue.length} invoice${overdue.length === 1 ? " is" : "s are"} overdue`,
      priority: "high",
      bodyKind: "overdue_summary",
      overdue,
      totalAmount,
      body: `${idList} — total at risk: ${formatInvoiceINR(totalAmount)}. Immediate follow-up recommended.`,
      time: "11:00 PM",
      actionLabel: "Send Reminder",
    });
  }

  const pend = pending[0];
  if (pend) {
    out.push({
      id: "ai-follow-up",
      title: `Follow up with ${pend.client}`,
      body: `${pend.id} (${formatInvoiceINR(pend.amount)}) is still pending. Payment activity will update this insight.`,
      priority: "medium",
      time: "10:48 PM",
      actionLabel: "Send Reminder",
      relatedInvoices: [pend],
    });
  }

  const topPending = [...pending].sort(compareAttentionInvoices).slice(0, 2);
  if (topPending.length > 0) {
    const sum = topPending.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const body =
      topPending.length >= 2
        ? `Based on ${topPending[0].id} (${formatInvoiceINR(topPending[0].amount)}) & ${topPending[1].id} (${formatInvoiceINR(topPending[1].amount)}) still open.`
        : `Based on ${topPending[0].id} (${formatInvoiceINR(topPending[0].amount)}) still open.`;
    out.push({
      id: "ai-cashflow",
      title: `Expected cash from key pending: ${formatInvoiceINR(sum)}`,
      body,
      priority: "low",
      time: "09:15 PM",
      actionLabel: "View Forecast",
    });
  }

  return out;
}
