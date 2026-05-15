import React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useInvoices } from "../src/context/InvoiceContext.jsx";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InvoiceStatusDonut() {
  const { invoices } = useInvoices();
  const statusConfig = [
    { key: "Paid", color: "#10B981" },
    { key: "Pending", color: "#F59E0B" },
    { key: "Overdue", color: "#F87171" },
  ];

  const totalInvoices = invoices.length;

  const statusRows = statusConfig.map((cfg) => {
    const filtered = invoices.filter((x) => x.status === cfg.key);
    const count = filtered.length;
    const amount = filtered.reduce((sum, x) => sum + x.amount, 0);
    const percent = totalInvoices === 0 ? 0 : Math.round((count / totalInvoices) * 100);

    return {
      name: cfg.key,
      count,
      amount,
      percent,
      color: cfg.color,
      value: count,
    };
  });

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-[#ECECEC] bg-white p-4 shadow-[0px_1px_8px_rgba(54,76,215,0.1)] sm:p-5">
      <header className="mb-4 flex items-start justify-between sm:mb-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary md:text-lg">Invoice Status</h3>
          <p className="dashboard-card-subtitle truncate">Breakdown By Payment Status</p>
        </div>
      </header>

      <div className="relative mx-auto h-[180px] w-full max-w-full sm:h-[200px] md:h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={<DonutTooltip />}
              cursor={false}
              wrapperStyle={{ outline: "none" }}
            />
            <Pie
              data={statusRows}
              dataKey="value"
              nameKey="name"
              innerRadius="48%"
              outerRadius="72%"
              paddingAngle={2}
              cornerRadius={8}
              animationDuration={420}
            >
              {statusRows.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-semibold leading-none text-text-heading sm:text-2xl md:text-[28px]">
              {totalInvoices}
            </div>
            <div className="mt-1 text-xs font-medium text-[#A8B1E1] sm:text-sm">Invoices</div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 overflow-hidden px-1 sm:space-y-3 sm:px-0">
        {statusRows.map((row) => (
          <LegendRow key={row.name} row={row} />
        ))}
      </div>
    </section>
  );
}

function LegendRow({ row }) {
  return (
    <div className="min-w-0 space-y-2 overflow-hidden rounded-lg bg-[#FAFBFF]/80 px-2 py-2 sm:bg-transparent sm:px-0 sm:py-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <span className="truncate text-sm font-medium text-text-primary">{row.name}</span>
        </div>
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-secondary sm:text-xs md:text-sm">
          {row.percent}%
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 pl-[18px]">
        <span className="min-w-0 truncate text-[11px] text-text-secondary sm:text-xs md:text-sm">
          {row.count} {row.count === 1 ? "invoice" : "invoices"}
        </span>
        <span className="max-w-full truncate text-right text-[11px] font-medium tabular-nums text-text-primary sm:text-xs md:text-sm">
          {formatINR(row.amount)}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2FA]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${row.percent}%`,
            backgroundColor: row.color,
          }}
        />
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-background-muted bg-white p-3 shadow-[4px_4px_8px_rgba(48,57,115,0.1)]">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: row?.color }}
        />
        <div className="text-sm font-semibold text-text-primary">{row?.name}</div>
      </div>
      <div className="mt-2 text-sm text-text-secondary">
        Invoices: <span className="font-semibold text-text-primary">{row?.count ?? 0}</span>
      </div>
      <div className="text-sm text-text-secondary">
        Amount: <span className="font-semibold text-text-primary">{formatINR(row?.amount ?? 0)}</span>
      </div>
    </div>
  );
}
