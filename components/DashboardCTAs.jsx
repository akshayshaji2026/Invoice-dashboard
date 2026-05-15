import React from "react";
import { FilePlus2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardModal } from "../src/context/DashboardModalContext.jsx";
import { useInvoices } from "../src/context/InvoiceContext.jsx";
import { useSettings } from "../src/context/SettingsContext.jsx";
import { sendReminderBulkModalPayload } from "../src/pages/dashboardModalContent.jsx";

const reminderBadgeClass =
  "absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#CE2222] px-[2px] text-[8px] font-bold leading-none text-white ring-2 ring-white";

/**
 * @param {"full" | "icon" | "fab-reminder" | "fab-add"} variant
 */
export function SendReminderButton({ variant = "full" }) {
  const { openModal } = useDashboardModal();
  const { invoices, overdueReminderCount, bulkOverdueRemindersAcknowledged } = useInvoices();
  const { settings } = useSettings();
  const reminderBadgeCount =
    settings.preferences.aiRemindersEnabled && !bulkOverdueRemindersAcknowledged ? overdueReminderCount : 0;

  if (variant === "fab-reminder") {
    return (
      <button
        type="button"
        onClick={() => openModal(sendReminderBulkModalPayload(invoices, 8))}
        aria-label="Send reminder"
        className="relative flex h-12 w-12 items-center justify-center overflow-visible rounded-full bg-[#FFF8F1] text-[#D97E1C] shadow-[0_4px_14px_rgba(217,126,28,0.35)] transition hover:scale-105 hover:opacity-95"
      >
        <Send className="h-5 w-5" aria-hidden />
        {reminderBadgeCount > 0 ? (
          <span className={reminderBadgeClass}>{reminderBadgeCount}</span>
        ) : null}
      </button>
    );
  }

  const isIcon = variant === "icon";

  return (
    <button
      type="button"
      onClick={() => openModal(sendReminderBulkModalPayload(invoices, 8))}
      aria-label="Send reminder"
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-visible bg-[#FFF8F1] text-[#D97E1C] transition hover:opacity-90",
        isIcon ? "h-9 w-9 rounded-full" : "h-10 gap-2 rounded-xl px-4 md:h-11",
      ].join(" ")}
    >
      <Send className="h-4 w-4 shrink-0" aria-hidden />
      {!isIcon ? <span className="text-sm font-normal">Send Reminder</span> : null}
      {reminderBadgeCount > 0 ? (
        <span className={reminderBadgeClass}>{reminderBadgeCount}</span>
      ) : null}
    </button>
  );
}

/**
 * @param {"full" | "icon" | "fab-add"} variant
 */
export function AddInvoiceNavButton({ variant = "full" }) {
  const navigate = useNavigate();

  if (variant === "fab-add") {
    return (
      <button
        type="button"
        onClick={() => navigate("/add-invoice")}
        aria-label="Add invoice"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2F51A1] text-white shadow-[0_4px_18px_rgba(47,81,161,0.45)] transition hover:scale-105 hover:bg-[#254278]"
      >
        <FilePlus2 className="h-6 w-6" aria-hidden />
      </button>
    );
  }

  const isIcon = variant === "icon";

  return (
    <button
      type="button"
      onClick={() => navigate("/add-invoice")}
      aria-label="Add invoice"
      className={[
        "inline-flex shrink-0 items-center justify-center bg-[#2F51A1] text-white transition hover:bg-[#254278]",
        isIcon ? "h-9 w-9 rounded-full" : "h-10 gap-2 rounded-xl px-4 md:h-11",
      ].join(" ")}
    >
      <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden />
      {!isIcon ? <span className="text-sm font-normal">Add Invoice</span> : null}
    </button>
  );
}

export function DashboardContentCTAs() {
  return (
    <div className="flex shrink-0 items-center gap-2 md:gap-3">
      <SendReminderButton variant="full" />
      <AddInvoiceNavButton variant="full" />
    </div>
  );
}

export function DashboardHeaderCTAs() {
  return (
    <div className="hidden shrink-0 items-center gap-1.5 overflow-visible md:flex md:gap-2">
      <SendReminderButton variant="icon" />
      <AddInvoiceNavButton variant="icon" />
    </div>
  );
}

export default function DashboardMobileFAB() {
  return (
    <div
      className="pointer-events-none fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3 md:hidden"
      aria-label="Quick actions"
    >
      <div className="pointer-events-auto">
        <SendReminderButton variant="fab-reminder" />
      </div>
      <div className="pointer-events-auto">
        <AddInvoiceNavButton variant="fab-add" />
      </div>
    </div>
  );
}
