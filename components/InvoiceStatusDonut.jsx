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
    <section className="relative rounded-[16px] bg-white p-5 border border-[#ECECEC] shadow-[0px_1px_8px_rgba(54,76,215,0.1)]">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-text-primary">Invoice Status</h3>
          <p className="mt-1 text-sm text-[#B1B1C2]">Breakdown By Payment Status

</p>
        </div>
      </header>

      <div className="relative h-[210px] w-full">
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
              innerRadius={52}
              outerRadius={76}
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

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[28px] font-semibold text-text-heading leading-none">
              {totalInvoices}
            </div>
            <div className="mt-1 text-[14px] font-medium text-[#A8B1E1]">Invoices</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {statusRows.map((row) => (
          <LegendRow key={row.name} row={row} />
        ))}
      </div>
    </section>
  );
}

function LegendRow({ row }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 min-w-[130px]">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <span className="font-medium text-text-primary">{row.name}</span>
        </div>

        <div className="text-text-secondary font-medium">{`${row.count} invoices`}</div>
        <div className="text-text-primary font-medium">{formatINR(row.amount)}</div>
        <div className="w-10 text-right text-text-secondary font-semibold">{`${row.percent} %`}</div>
      </div>

      <div className="h-2 w-full rounded-full bg-[#EEF2FA] overflow-hidden">
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

function DonutTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload;

  return (
    <div className="rounded-2xl bg-white p-3 border border-background-muted shadow-[4px_4px_8px_rgba(48,57,115,0.1)]">
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

