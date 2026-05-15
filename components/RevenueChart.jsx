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

const CHART_HEIGHT = 280;
const Y_AXIS_WIDTH = 48;

function computeYMax(data) {
  let max = 0;
  data.forEach((d) => {
    max = Math.max(max, Number(d.current) || 0, Number(d.previous) || 0);
  });
  if (max <= 0) return 100000;
  const padded = max * 1.1;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  return Math.ceil(padded / magnitude) * magnitude;
}

function buildYTicks(yMax, count = 4) {
  const ticks = [];
  for (let i = 0; i <= count; i += 1) {
    ticks.push(Math.round((yMax / count) * i));
  }
  return ticks;
}

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

  const yMax = useMemo(() => computeYMax(chartData), [chartData]);
  const yTicks = useMemo(() => buildYTicks(yMax), [yMax]);

  const plotMinWidth = useMemo(
    () => Math.max(chartData.length * 56, 280),
    [chartData.length],
  );

  useEffect(() => {
    if (!isYearly) return;
    setSelectedComparison(revenueFilterOptions.comparisons[0].value);
  }, [isYearly]);

  return (
    <section className="relative rounded-[16px] border border-[#ECECEC] bg-white p-4 shadow-[0px_1px_8px_rgba(54,76,215,0.1)] sm:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:gap-2.5 md:mb-4 md:flex-row md:flex-nowrap md:items-center md:justify-between md:gap-3 lg:mb-3 lg:items-center lg:gap-2">
        <div className="min-w-0 flex-1 md:max-w-[50%] lg:max-w-[44%] xl:max-w-[52%]">
          <h3 className="whitespace-nowrap text-base font-semibold text-[#17171B] md:text-lg lg:text-[15px] xl:text-lg">
            Revenue Overview
          </h3>
          <p className="dashboard-card-subtitle truncate">
            {isYearly
              ? "Annual totals for the last several fiscal years"
              : "Compare invoice revenue with historical periods"}
          </p>
        </div>

        <div className="grid w-full max-w-full shrink-0 grid-cols-2 gap-2 md:flex md:w-auto md:max-w-none md:flex-nowrap md:items-center md:justify-end md:gap-1.5 lg:max-w-[54%] xl:max-w-[42%]">
          <CustomDropdown
            size="sm"
            className="w-full min-w-0 md:w-[112px] md:max-w-[112px] md:shrink-0 lg:w-[106px] lg:max-w-[106px] xl:w-[118px] xl:max-w-[118px]"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={revenueFilterOptions.periods}
          />
          {!isYearly ? (
            <CustomDropdown
              size="sm"
              className="w-full min-w-0 md:w-[112px] md:max-w-[112px] md:shrink-0 lg:w-[106px] lg:max-w-[106px] xl:w-[118px] xl:max-w-[118px]"
              value={selectedComparison}
              onChange={setSelectedComparison}
              options={revenueFilterOptions.comparisons}
            />
          ) : null}
        </div>
      </div>

      <div className="flex w-full min-w-0">
        <div
          className="flex shrink-0 flex-col justify-between py-3 pr-1"
          style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}
          aria-hidden
        >
          {[...yTicks].reverse().map((tick) => (
            <span
              key={tick}
              className="text-right text-[11px] leading-none text-[#9C9CA3] tabular-nums"
            >
              {formatIndianCompactCurrency(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div style={{ minWidth: plotMinWidth, height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={chartData}
                barCategoryGap="20%"
                barGap={2}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke="#EFF2F6" vertical={false} />
                <XAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tickMargin={8}
                  tick={{ fill: "#9C9CA3", fontSize: 11, textAnchor: "middle" }}
                />
                <YAxis hide domain={[0, yMax]} />
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
                    radius={[6, 6, 0, 0]}
                    maxBarSize={20}
                    activeBar={false}
                  />
                ) : (
                  <>
                    <Bar
                      dataKey="previous"
                      name="Previous"
                      fill="#DDD6FE"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={16}
                      activeBar={false}
                    />
                    <Bar
                      dataKey="current"
                      name="Current"
                      fill="#2F51A1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={16}
                      activeBar={false}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
