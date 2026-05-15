import React from "react";
import { useInvoices } from "../src/context/InvoiceContext.jsx";

export default function StatsCards() {
  const { metrics } = useInvoices();
  const statsCardsData = [
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: metrics.paidAmount,
      currency: "INR",
      metaLabel: `${metrics.totalInvoices} Invoices`,
      trendValue: "+10%",
      trendDirection: "up",
      iconKey: "revenue",
      iconBg: "bg-green-50",
    },
    {
      id: "pending-amount",
      title: "Pending Amount",
      value: metrics.pendingAmount,
      currency: "INR",
      metaLabel: "Unpaid Invoices",
      trendValue: "-10%",
      trendDirection: "down",
      iconKey: "pending",
      iconBg: "bg-[#FFF4D8]",
    },
    {
      id: "overdue-amount",
      title: "Overdue Amount",
      value: metrics.overdueAmount,
      currency: "INR",
      metaLabel: "Critical Follow-ups",
      trendValue: "-10%",
      trendDirection: "down",
      iconKey: "overdue",
      iconBg: "bg-[#FFE2E1]",
    },
    {
      id: "total-invoices",
      title: "Total Invoices",
      value: metrics.totalInvoices,
      currency: null,
      metaLabel: "This Billing cycle",
      trendValue: "+3",
      trendDirection: "up",
      iconKey: "invoice",
      iconBg: "bg-[#E5F0FF]",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statsCardsData.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </section>
  );
}

function StatCard({ card }) {
  const isTrendUp = card.trendDirection === "up";

  return (
    <article className="relative rounded-[16px] border border-[#ECECEC] bg-white px-5 pb-3.5 pt-4 shadow-[0px_1px_8px_rgba(54,76,215,0.1)]">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm font-medium text-text-label">{card.title}</p>
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-md",
            card.iconBg,
          ].join(" ")}
        >
          <CardIcon type={card.iconKey} />
        </div>
      </div>

      <p className="mb-3 text-[24px] font-semibold leading-none tracking-tight text-text-heading">
        {formatValue(card.value, card.currency)}
      </p>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#717BBC]">{card.metaLabel}</p>

        <div
          className={[
            "flex items-center gap-1.5 text-xs font-semibold",
            isTrendUp ? "text-green-600" : "text-[#D92D20]",
          ].join(" ")}
        >
          <TrendIcon isUp={isTrendUp} />
          <span>{card.trendValue}</span>
        </div>
      </div>
    </article>
  );
}

function formatValue(value, currency) {
  if (!currency) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function TrendIcon({ isUp }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={!isUp ? "rotate-180" : ""}
    >
      <path
        d="M3 11L11 3M11 3H6.5M11 3V7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardIcon({ type }) {
  if (type === "pending") return <ClockIcon />;
  if (type === "overdue") return <DangerIcon />;
  if (type === "invoice") return <DocumentIcon />;
  return <GraphIcon />;
}

function GraphIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-green-600">
      <path
        d="M5 18V10M12 18V6M19 18V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 18.5H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="#B54708" strokeWidth="1.8" />
      <path
        d="M12 8V12L14.5 13.5"
        stroke="#B54708"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="#D92D20" strokeWidth="1.8" />
      <path
        d="M12 8V12"
        stroke="#D92D20"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.5" r="1" fill="#D92D20" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="2.5" stroke="#1D4ED8" strokeWidth="1.8" />
      <path d="M9 10H15" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 14H13.5" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
