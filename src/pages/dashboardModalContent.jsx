import React from "react";
import { BellRing } from "lucide-react";
import SendRemindersModalBody from "../../components/SendRemindersModalBody.jsx";

function reviewSendRemindersTitle() {
  return (
    <span className="inline-flex items-center gap-2">
      <BellRing className="h-[18px] w-[18px] shrink-0 text-[#2F51A1]" strokeWidth={2} aria-hidden />
      Review & send reminders
    </span>
  );
}

const reminderModalShell = {
  confirmLabel: "",
  cancelLabel: "Close",
  onConfirm: null,
  tone: "default",
  footerMode: "none",
  maxWidthClass: "max-w-2xl",
};

/** Rich copy for dashboard action modals (AI Insights + greeting CTAs). */
export function insightModalPayload(insight) {
  const label = (insight.actionLabel || "").toLowerCase();

  if (label.includes("forecast")) {
    return {
      title: "Cash flow forecast",
      body: (
        <>
          <p className="mb-3">
            This preview uses the same signals as the insight:{" "}
            <span className="font-medium text-[#303973]">{insight.title}</span>
          </p>
          <p>{insight.body}</p>
          <p className="mt-3 rounded-lg bg-[#F5F3FF] p-3 text-xs text-[#575E78]">
            In a production build, this would open the forecast workspace with charts, scenario sliders, and export.
          </p>
        </>
      ),
      confirmLabel: "Open forecast",
      cancelLabel: "Not now",
      tone: "accent",
      onConfirm: () => {},
      footerMode: "default",
      maxWidthClass: "max-w-md",
    };
  }

  return {
    title: reviewSendRemindersTitle(),
    body: <SendRemindersModalBody insight={insight} />,
    ...reminderModalShell,
  };
}

/**
 * Bulk “Send reminder” CTA: queues up to `max` overdue invoices (newest first).
 */
export function sendReminderBulkModalPayload(invoices, max = 8) {
  const overdue = [...(invoices || [])]
    .filter((i) => i.status === "Overdue")
    .sort((a, b) => {
      const na = Number(String(a.id).replace(/\D/g, "")) || 0;
      const nb = Number(String(b.id).replace(/\D/g, "")) || 0;
      return nb - na;
    })
    .slice(0, max);

  const insight = {
    id: "bulk-overdue-reminders",
    title: "Overdue accounts",
    bodyKind: "overdue_summary",
    overdue: overdue.map((i) => ({
      id: i.id,
      client: i.client,
      amount: i.amount,
      email: i.email,
    })),
  };

  return {
    title: reviewSendRemindersTitle(),
    body: <SendRemindersModalBody insight={insight} />,
    ...reminderModalShell,
  };
}
