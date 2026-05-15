import React from "react";
import { Send, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardModal } from "../src/context/DashboardModalContext.jsx";
import { useInvoices } from "../src/context/InvoiceContext.jsx";
import { useSettings } from "../src/context/SettingsContext.jsx";
import { sendReminderBulkModalPayload } from "../src/pages/dashboardModalContent.jsx";

export default function GreetingCTA() {
  const navigate = useNavigate();
  const { openModal } = useDashboardModal();
  const { invoices, overdueReminderCount, bulkOverdueRemindersAcknowledged } = useInvoices();
  const { settings } = useSettings();
  const displayName = settings.profile.displayName || "John Smith";
  const reminderBadgeCount =
    settings.preferences.aiRemindersEnabled && !bulkOverdueRemindersAcknowledged ? overdueReminderCount : 0;

  return (
    <section className="px-1 py-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[24px] leading-none font-semibold text-[#1C1C1C]">
            Welcome, {displayName}
          </h2>
          <p className="mt-2 text-[14px] font-normal text-[#B2B2B2]">
            Kerala, India
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => openModal(sendReminderBulkModalPayload(invoices, 8))}
            className="h-11 rounded-xl bg-[#FFF8F1] px-4 flex items-center justify-center gap-2.5 text-[#D97E1C] text-sm font-normal hover:opacity-90 transition"
          >
            <Send className="h-4 w-4" aria-hidden />
            <span className="text-sm">Send Reminder</span>
            {reminderBadgeCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#CE2222] px-1 text-[11px] font-medium leading-none text-white">
                {reminderBadgeCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => navigate("/add-invoice")}
            className="h-11 rounded-xl bg-[#2F51A1] px-4 flex items-center justify-center gap-2.5 text-sm text-white font-normal transition hover:bg-[#254278]"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#254278] text-white">
              <FilePlus2 className="h-4 w-4" />
            </span>
            <span className="text-sm">Add Invoice</span>
          </button>
        </div>
      </div>
    </section>
  );
}

