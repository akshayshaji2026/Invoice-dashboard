import React from "react";
import { useSettings } from "../src/context/SettingsContext.jsx";
import { useScrollDepth } from "../src/context/LayoutScrollContext.jsx";
import { DashboardContentCTAs } from "./DashboardCTAs.jsx";

export default function GreetingCTA() {
  const { settings } = useSettings();
  const { isScrolled } = useScrollDepth();
  const displayName = settings.profile.displayName || "John Smith";

  return (
    <section className="px-1 py-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-none text-[#1C1C1C] md:text-xl lg:text-2xl">
            Welcome, {displayName}
          </h2>
          <p className="mt-2 text-sm font-normal text-[#B2B2B2]">Kerala, India</p>
        </div>

        {!isScrolled ? (
          <div className="hidden shrink-0 md:block">
            <DashboardContentCTAs />
          </div>
        ) : null}
      </div>
    </section>
  );
}
