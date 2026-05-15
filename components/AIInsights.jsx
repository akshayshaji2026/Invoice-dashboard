import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, BadgeCheck, ChevronRight, AlertCircle, BarChart3, Sparkles } from "lucide-react";
import { formatInvoiceINR, formatInvoiceINRCompactLakh } from "./invoiceTableShared.jsx";
import { useInvoices } from "../src/context/InvoiceContext.jsx";
import { useSettings } from "../src/context/SettingsContext.jsx";
import { useDashboardModal } from "../src/context/DashboardModalContext.jsx";
import { insightModalPayload } from "../src/pages/dashboardModalContent.jsx";
import { buildAiInsights, getSortedOverdueInvoices } from "../src/utils/buildAiInsights.js";

const priorityStyles = {
  high: {
    bg: "bg-[#FFEAEA]",
    iconColor: "#C81A1A",
    bodyColor: "text-[#B1B1C2]",
    actionColor: "text-[#C81A1A]",
    btnBg: "bg-[#FCE3E3]",
    Icon: AlertCircle,
  },
  medium: {
    bg: "bg-[#FFF3EA]",
    iconColor: "#D97E1C",
    bodyColor: "text-[#B1B1C2]",
    actionColor: "text-[#D97E1C]",
    btnBg: "bg-[#FFF3E8]",
    Icon: Bell,
  },
  low: {
    bg: "bg-[#EFF2FF]",
    iconColor: "#2F51A1",
    bodyColor: "text-[#B1B1C2]",
    actionColor: "text-primary",
    btnBg: "bg-[#E8F0FF]",
    Icon: BarChart3,
  },
};

const invoiceIdLinkClass =
  "cursor-pointer font-semibold text-[#2F51A1] underline-offset-2 transition-colors hover:underline";

function OverdueSummaryBody({ insight, validInvoiceIds }) {
  const overdue = insight.overdue || [];
  const totalAmount = overdue.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const shown = overdue.slice(0, 2);
  const moreCount = Math.max(0, overdue.length - 2);

  return (
    <span className="block leading-[22px]">
      <span>
        Total at risk:{" "}
        <span className="font-semibold text-[#1C1C1C]">{formatInvoiceINR(totalAmount)}</span>
        {" across "}
        {overdue.length} overdue invoice{overdue.length === 1 ? "" : "s"}.
      </span>
      <span className="mt-1 block">
        {shown.map((inv, i) => (
          <React.Fragment key={inv.id}>
            {i > 0 ? ", " : null}
            {validInvoiceIds.has(inv.id) ? (
              <Link to={`/invoices/view/${encodeURIComponent(inv.id)}`} className={invoiceIdLinkClass}>
                {inv.id}
              </Link>
            ) : (
              <span className="font-semibold text-[#B1B1C2]">{inv.id}</span>
            )}
          </React.Fragment>
        ))}
        {moreCount > 0 ? (
          <>
            {shown.length > 0 ? ", " : null}
            <Link to="/invoices?filter=overdue" className={invoiceIdLinkClass}>
              and {moreCount} more
            </Link>
          </>
        ) : null}
        <span>. Immediate follow-up recommended.</span>
      </span>
    </span>
  );
}

function renderBodyWithClickableInvoiceIds(bodyText, validInvoiceIds) {
  const parts = bodyText.split(/(INV-\d+)/g);

  return parts.map((part, idx) => {
    const isInvoiceId = /^INV-\d+$/.test(part);
    if (!isInvoiceId) {
      return (
        <span key={`t-${idx}`}>
          {part}
        </span>
      );
    }

    if (validInvoiceIds.has(part)) {
      return (
        <Link key={`inv-${part}-${idx}`} to={`/invoices/view/${encodeURIComponent(part)}`} className={invoiceIdLinkClass}>
          {part}
        </Link>
      );
    }

    return (
      <span key={`inv-missing-${part}-${idx}`} className="font-semibold text-[#B1B1C2]">
        {part}
      </span>
    );
  });
}

function InsightCard({ insight, onOpenAction, validInvoiceIds }) {
  const config = priorityStyles[insight.priority] ?? priorityStyles.low;
  const { Icon } = config;

  return (
    <div className="group relative w-full rounded-xl p-[1px] bg-gradient-to-br from-[#ECE7FF] via-[#E9EEFF] to-[#F0F0F0] shadow-[0px_2px_10px_rgba(73,86,180,0.08)] transition-all duration-200">
      <div className="rounded-[11px] bg-white/95 p-4 flex flex-col gap-2.5 backdrop-blur-[1px]">
        <div className="flex items-start gap-3.5">
          <div className={`flex-shrink-0 w-10 h-10 ${config.bg} rounded-[10px] flex items-center justify-center shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.7)]`}>
            <Icon size={20} color={config.iconColor} strokeWidth={1.7} />
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center">
              <h4 className="text-base font-medium text-[#1C1C1C] font-['Inter',ui-sans-serif,system-ui,sans-serif]">
                {insight.title}
              </h4>
            </div>

            <p
              className={`text-[13px] leading-[22px] font-normal font-['Inter',ui-sans-serif,system-ui,sans-serif] ${config.bodyColor}`}
            >
              {insight.bodyKind === "overdue_summary" ? (
                <OverdueSummaryBody insight={insight} validInvoiceIds={validInvoiceIds} />
              ) : (
                renderBodyWithClickableInvoiceIds(insight.body || "", validInvoiceIds)
              )}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenAction(insight)}
                className={`w-fit h-8 px-3.5 flex items-center gap-3.5 rounded-lg ${config.btnBg} transition-opacity hover:opacity-80`}
              >
                <span className={`text-[13px] font-normal font-['Inter'] ${config.actionColor}`}>
                  {insight.actionLabel}
                </span>
                <ChevronRight size={14} className={config.actionColor} />
              </button>
              <span className="text-[12px] font-normal text-[#B2B2B2] font-['Inter']">
                {insight.time || "11:00 PM"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const { openModal } = useDashboardModal();
  const { invoices, dismissedAiInsightIds } = useInvoices();
  const { settings } = useSettings();
  const aiFollowUpsEnabled = settings.preferences.aiRemindersEnabled;

  const validInvoiceIds = useMemo(() => new Set(invoices.map((i) => i.id)), [invoices]);

  const { syncedInsights, overdueTotalAtRisk } = useMemo(() => {
    const overdueInvoices = getSortedOverdueInvoices(invoices);
    const overdueTotalAtRiskSum = overdueInvoices.reduce(
      (acc, inv) => acc + (Number(inv.amount) || 0),
      0,
    );
    const insights = aiFollowUpsEnabled ? buildAiInsights(invoices, overdueInvoices) : [];
    return {
      syncedInsights: insights,
      overdueTotalAtRisk: overdueTotalAtRiskSum,
    };
  }, [invoices, aiFollowUpsEnabled]);

  const insightsToRender = useMemo(() => {
    if (!aiFollowUpsEnabled) return [];
    const dismissed = new Set(dismissedAiInsightIds);
    return syncedInsights.filter((i) => !dismissed.has(i.id));
  }, [syncedInsights, dismissedAiInsightIds, aiFollowUpsEnabled]);

  const actionItemsCount = insightsToRender.length;

  const emptyInsightsMessage = useMemo(() => {
    if (!aiFollowUpsEnabled) {
      return "Automatic AI follow-ups are turned off in Settings. Enable them to see overdue and pending insights here.";
    }
    if (syncedInsights.length === 0) {
      return "No active insights — when invoices are pending or overdue, they will appear here. Marking an invoice Paid removes it from these alerts.";
    }
    if (insightsToRender.length === 0) {
      return "Displayed insights were cleared from recent reminders; new alerts return when invoice activity changes.";
    }
    return "";
  }, [aiFollowUpsEnabled, syncedInsights.length, insightsToRender.length]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-[1px] border-transparent shadow-[0px_1px_8px_rgba(54,76,215,0.1)] [background:linear-gradient(white,white)_padding-box,linear-gradient(to_bottom,#9181F4,#5038ED)_border-box] [background-clip:padding-box,border-box] [background-origin:padding-box,border-box]"
    >
      <section
        className="flex h-[641px] w-full flex-col rounded-[15px] p-5"
        style={{ background: "linear-gradient(135deg, #FAF2FF 0%, #F3F9FF 100%)" }}
      >
        <header className="flex items-center justify-between mb-[23px]">
          <h3 className="text-[18px] leading-[1.2] font-semibold tracking-[-0.03em] text-[#17171B] font-['Inter',ui-sans-serif,system-ui,sans-serif]">
            AI Insights
          </h3>
          
          <div className="flex items-center gap-1 px-2 py-1 bg-white border border-[#E4E4E7] rounded-md">
            <BadgeCheck size={14} color="#068BE5" />
            <span className="text-[12px] font-medium text-[#068BE5] font-['Inter']">
              Insights
            </span>
          </div>
        </header>

        <div
          className="mb-6 rounded-xl border border-[#E7DDF9] p-4 shadow-[0px_1px_6px_rgba(84,73,173,0.08)]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,255,0.92) 100%)" }}
        >
          <div className="grid grid-cols-3 items-center">
            <div className="pr-3">
              <p className="text-[10px] font-medium tracking-wide text-[#B1B1C2]">Action Items</p>
              <p className="mt-1 text-[13px] font-semibold text-[#303973]">
                {actionItemsCount} Pending
              </p>
            </div>

            <div className="px-3 border-l border-r border-[#E7DDF9]">
              <p className="text-[10px] font-medium tracking-wide text-[#B1B1C2]">At Risk</p>
              <p className="mt-1 text-[13px] font-semibold text-[#C81A1A]">
                {formatInvoiceINRCompactLakh(overdueTotalAtRisk)}
              </p>
            </div>

            <div className="pl-3">
              <p className="text-[10px] font-medium tracking-wide text-[#B1B1C2]">Response</p>
              <p className="mt-1 text-[13px] font-semibold text-[#303973]">83%</p>
            </div>
          </div>

          <div
            className="mt-3 rounded-lg px-2.5 py-2 shadow-sm ring-1 ring-white/15"
            style={{ background: "linear-gradient(135deg, #9181F4 0%, #5038ED 100%)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles
                size={13}
                className="shrink-0 text-white drop-shadow-[0_1px_2px_rgba(40,20,90,0.5)]"
                strokeWidth={2}
                aria-hidden
              />
              <p className="text-[11px] font-normal font-['Inter',ui-sans-serif,system-ui,sans-serif] leading-[1.45] text-white [text-shadow:0_1px_3px_rgba(40,20,90,0.45)]">
                <span className="font-semibold text-white [text-shadow:0_1px_3px_rgba(40,20,90,0.55)]">83%</span> of clients paid
                within 24h after an AI reminder.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex-1 min-h-0">
          <div className="h-full flex flex-col gap-4 overflow-y-auto pr-1 pt-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {insightsToRender.length === 0 ? (
              <p className="rounded-lg border border-[#E7E7EF] bg-white/80 px-3 py-4 text-center text-[13px] font-normal leading-relaxed text-[#71717A] font-['Inter',ui-sans-serif,system-ui,sans-serif]">
                {emptyInsightsMessage}
              </p>
            ) : (
              insightsToRender.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  validInvoiceIds={validInvoiceIds}
                  onOpenAction={(inv) => openModal(insightModalPayload(inv))}
                />
              ))
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#F8F3FF] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#F5F8FF] to-transparent" />
        </div>
      </section>
    </div>
  );
}