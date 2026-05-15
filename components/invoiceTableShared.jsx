/** Shared helpers for Recent Invoices & full Invoice Listing tables */

export function formatInvoiceINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Lakhs-style compact label for dashboard risk (e.g. ₹2.55L). Below ₹1L uses full INR formatting. */
export function formatInvoiceINRCompactLakh(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n <= 0) return "₹0";
  if (n < 100000) return formatInvoiceINR(n);
  const lakhs = n / 100000;
  return `₹${parseFloat(lakhs.toFixed(2))}L`;
}

export function formatInvoiceDateShort(isoDate) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getDayDiff(isoDate) {
  if (!isoDate) return 0;
  const dueDate = new Date(isoDate);
  const now = new Date();
  const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStatusBadgeStyles(status) {
  if (status === "Paid") {
    return {
      bg: "bg-[#E7F7EC]",
      text: "text-[#0F8E13]",
      dot: "#0F8E13",
    };
  }
  if (status === "Overdue") {
    return {
      bg: "bg-[#FCE3E3]",
      text: "text-[#CE2222]",
      dot: "#CE2222",
    };
  }
  return {
    bg: "bg-[#FFF3E8]",
    text: "text-[#D97E1C]",
    dot: "#D97E1C",
  };
}

export function getDueMeta(row) {
  if (row.status === "Paid") return null;
  const diff = getDayDiff(row.dueDate);
  if (row.status === "Overdue" || diff < 0) {
    return {
      text: `${Math.abs(diff)} D Overdue`,
      className: "text-[#CE2222]",
    };
  }
  return {
    text: `${diff} D Left`,
    className: "text-[#D97E1C]",
  };
}

/** Prefer explicit `invoice.priority`; otherwise infer from payment status */
export function getPriorityFromInvoice(invoice) {
  const p = invoice?.priority;
  if (p === "High" || p === "Medium" || p === "Low") return p;
  if (invoice.status === "Overdue") return "High";
  if (invoice.status === "Pending") return "Medium";
  return "Low";
}

export function getPriorityBadgeStyles(priority) {
  if (priority === "High") {
    return {
      bg: "bg-[#FCE8E8]",
      text: "text-[#AA2E26]",
      border: "border-[#F0C4C4]",
    };
  }
  if (priority === "Medium") {
    return {
      bg: "bg-[#FFF6E9]",
      text: "text-[#AF6B14]",
      border: "border-[#FAD9AE]",
    };
  }
  return {
    bg: "bg-[#EEFBF1]",
    text: "text-[#287D3C]",
    border: "border-[#CDE9D6]",
  };
}

export function clientAvatarSrc(name) {
  const safe = encodeURIComponent(name || "Client");
  return `https://ui-avatars.com/api/?name=${safe}&background=F5F7FF&color=303973`;
}
