/**
 * Resolve full invoice rows for reminder UI from an AI insight payload.
 * Merges lightweight insight.invoice stubs with live context invoices by id.
 */
export function getReminderQueueFromInsight(insight, allInvoices = []) {
  if (!insight) return [];
  const byId = new Map(allInvoices.map((i) => [i.id, i]));

  const merge = (stub) => {
    const full = byId.get(stub.id) || stub;
    return { ...full, ...stub, id: stub.id ?? full.id };
  };

  if (insight.bodyKind === "overdue_summary" && Array.isArray(insight.overdue)) {
    return insight.overdue.map(merge);
  }
  if (Array.isArray(insight.relatedInvoices)) {
    return insight.relatedInvoices.map(merge);
  }
  if (Array.isArray(insight.queueInvoices)) {
    return insight.queueInvoices.map(merge);
  }
  return [];
}
