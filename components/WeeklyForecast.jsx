import React from "react";
import { weeklyCashForecastData } from "../data/mockData";
import { formatInvoiceINR } from "./invoiceTableShared.jsx";

export default function WeeklyForecast() {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[16px] border border-slate-100 bg-white p-4 shadow-sm">
      <header className="mb-3 shrink-0">
        <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.02em] text-[#17171B]">
          Weekly Cash Forecast
        </h3>
        <p className="dashboard-card-subtitle truncate">Next 4 expected payouts</p>
      </header>

      <ul className="flex min-h-0 flex-1 flex-col justify-start gap-2">
        {weeklyCashForecastData.map((row) => (
          <li
            key={row.id}
            className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[#ECECEC] bg-[#FAFAFF] px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#303973]">{row.client}</p>
              <p className="mt-0.5 text-xs text-[#828BB9]">{row.payoutDate}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-semibold tabular-nums text-[#17171B]">
                {formatInvoiceINR(row.amount)}
              </span>
              <span className="inline-flex rounded-md bg-[#E8F5E9] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#0F8E13]">
                Expected
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
