import React from "react";
import SideNavigation from "../../components/SideNavigation";
import Header from "../../components/Header";
import { useLayoutScroll } from "../context/LayoutScrollContext.jsx";

/**
 * Only `mainScrollRef` uses `overflow-y: auto`. Ancestors use `overflow-visible` (or
 * `overflow-x-clip` on the shell) so `position: sticky` works inside the scroll column.
 */
export default function MainLayout({
  title = "Dashboard",
  showAddInvoice = true,
  children,
}) {
  const { mainScrollRef, onMainScroll } = useLayoutScroll();

  return (
    <div className="flex h-screen min-h-0 overflow-x-clip bg-[#F9F9FF]">
      <SideNavigation />

      <div className="ml-0 flex min-h-0 min-w-0 flex-1 flex-col lg:ml-20 xl:ml-64">
        <div className="sticky top-0 z-40 shrink-0 bg-[#F9F9FF]/95 px-4 pb-2 pt-4 backdrop-blur-sm md:px-8 md:pt-6">
          <Header title={title} showAddInvoice={showAddInvoice} />
        </div>

        <div
          ref={mainScrollRef}
          onScroll={onMainScroll}
          className="min-h-0 w-full min-w-0 flex-1 overflow-x-clip overflow-y-auto px-4 pb-4 pt-2 md:px-8 md:pb-8"
        >
          <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-4 md:space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
