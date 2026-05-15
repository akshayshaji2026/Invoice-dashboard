/** Default opening line for invoices, e.g. "Dear Zomato," */
export function defaultInvoiceGreeting(clientName) {
  const name = (clientName || "").trim();
  if (!name) return "Dear Customer,";
  return `Dear ${name},`;
}
