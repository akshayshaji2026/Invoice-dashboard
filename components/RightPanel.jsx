import React from "react";
import AIInsights from "./AIInsights";
import ActivityFeed from "./ActivityFeed";
import WeeklyForecast from "./WeeklyForecast";

export default function RightPanel() {
  return (
    <aside className="flex h-full min-h-0 w-full flex-1 flex-col gap-6">
      <div className="shrink-0">
        <AIInsights />
      </div>
      <div className="shrink-0">
        <ActivityFeed />
      </div>
      <WeeklyForecast />
    </aside>
  );
}
