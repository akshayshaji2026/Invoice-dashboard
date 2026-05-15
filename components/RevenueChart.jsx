import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  revenueChartDataByFilter,
  revenueFilterOptions,
} from "../data/mockData";
import { CustomDropdown } from "./ui/CustomDropdown.jsx";

export default function RevenueChart() {
  const [selectedPeriod, setSelectedPeriod] = useState(
    revenueFilterOptions.periods[0].value,
  );
  const [selectedComparison, setSelectedComparison] = useState(
    revenueFilterOptions.comparisons[0].value,
  );

  const isYearly = selectedPeriod === "yearly";

  const chartData = useMemo(() => {
    if (isYearly) {
      return revenueChartDataByFilter.yearly?.progression ?? [];
    }
    return (
      revenueChartDataByFilter[selectedPeriod]?.[selectedComparison] ??
      revenueChartDataByFilter.monthly.previousPeriod
    );
  }, [selectedPeriod, selectedComparison, isYearly]);

  useEffect(() => {
    if (!isYearly) return;
    setSelectedComparison(revenueFilterOptions.comparisons[0].value);
  }, [isYearly]);

  const handlePeriodChange = (next) => {
    setSelectedPeriod(next);
  };

  return (
    <section className="relative rounded-[16px] border border-[#ECECEC] bg-white p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.1)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-[#17171B]">Revenue Overview</h3>
          <p className="mt-1 text-sm text-[#B1B1C2]">
            {isYearly
              ? "Annual totals for the last several fiscal years"
              : "Compare invoice revenue with historical periods"}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <CustomDropdown
            size="sm"
            className="min-w-[170px]"
            value={selectedPeriod}
            onChange={handlePeriodChange}
            options={revenueFilterOptions.periods}
          />
          {!isYearly ? (
            <CustomDropdown
              size="sm"
              className="min-w-[170px]"
              value={selectedComparison}
              onChange={setSelectedComparison}
              options={revenueFilterOptions.comparisons}
            />
          ) : null}
        </div>
      </div>

      <div className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            barCategoryGap={18}
            barGap={4}
            margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
          >
            <CartesianGrid stroke="#EFF2F6" vertical={false} />
            <XAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              interval={0}
              tickMargin={10}
              tick={{ fill: "#9C9CA3", fontSize: 12, textAnchor: "middle" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "#9C9CA3", fontSize: 12 }}
              tickFormatter={formatIndianCompactCurrency}
            />
            <Tooltip
              content={<RevenueTooltip isYearly={isYearly} />}
              cursor={{ fill: "#F5F7FF" }}
              wrapperStyle={{ outline: "none" }}
            />

            {isYearly ? (
              <Bar
                dataKey="current"
                name="Annual revenue"
                fill="#2F51A1"
                radius={[8, 8, 0, 0]}
                maxBarSize={36}
                activeBar={false}
              />
            ) : (
              <>
                {/* Previous (light) on the left, current (primary) on the right */}
                <Bar
                  dataKey="previous"
                  name="Previous"
                  fill="#DDD6FE"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={26}
                  activeBar={false}
                />
                <Bar
                  dataKey="current"
                  name="Current"
                  fill="#2F51A1"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={26}
                  activeBar={false}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function RevenueTooltip({ active, payload, label, isYearly }) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  if (isYearly) {
    const v = row.current ?? 0;
    const line = row.periodLabel ? `${row.periodLabel}: ${formatTooltipCompact(v)}` : formatTooltipCompact(v);
    return (
      <div className="rounded-xl border-none bg-white p-4 shadow-[0px_12px_32px_rgba(48,57,115,0.15)] outline-none">
        <p className="mb-1 text-xs font-medium text-[#828BB9]">{label}</p>
        <p className="text-sm font-bold text-[#303973]">{line}</p>
      </div>
    );
  }

  const previous = row.previous ?? 0;
  const current = row.current ?? 0;
  const previousPeriodLabel =
    row.previousPeriodLabel ?? (typeof label === "string" ? `${label} (previous)` : "Previous");
  const currentPeriodLabel =
    row.currentPeriodLabel ?? (typeof label === "string" ? `${label} (current)` : "Current");

  return (
    <div className="rounded-xl border-none bg-white p-4 shadow-[0px_12px_32px_rgba(48,57,115,0.15)] outline-none">
      <p className="mb-2 text-xs font-medium text-[#828BB9]">{label}</p>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[#7C6FDD]">
          {previousPeriodLabel}: {formatTooltipCompact(previous)}
        </p>
        <p className="text-sm font-bold text-[#303973]">
          {currentPeriodLabel}: {formatTooltipCompact(current)}
        </p>
      </div>
    </div>
  );
}

function formatTooltipCompact(value) {
  const n = Number(value) || 0;
  if (n >= 100000) {
    const lakhs = n / 100000;
    const rounded = lakhs >= 10 ? Math.round(lakhs * 10) / 10 : Math.round(lakhs * 10) / 10;
    return `₹${rounded}L`;
  }
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatIndianCompactCurrency(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}
