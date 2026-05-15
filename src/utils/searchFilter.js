/** Match dashboard search against client name and invoice id/number. */
export function matchesInvoiceClientSearch(item, searchQuery) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;

  const clientName = (item.clientName ?? item.client ?? "").toLowerCase();
  const invoiceNumber = String(item.invoiceNumber ?? item.id ?? "").toLowerCase();

  return clientName.includes(q) || invoiceNumber.includes(q);
}
