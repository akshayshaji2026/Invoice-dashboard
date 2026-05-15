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
    <div className="flex h-screen min-h-0 overflow-x-clip overflow-y-visible bg-[#F9F9FF]">
      <SideNavigation />

      <div className="ml-[280px] flex h-screen min-h-0 min-w-0 flex-1 flex-col overflow-visible">
        <div className="shrink-0 px-6 pt-6">
          <Header title={title} showAddInvoice={showAddInvoice} />
        </div>

        <div
          ref={mainScrollRef}
          onScroll={onMainScroll}
          className="h-[calc(100vh-7.25rem)] min-h-0 w-full overflow-x-clip overflow-y-auto px-6 pb-6 pt-2"
        >
          <div className="mx-auto max-w-[1400px] space-y-6 overflow-visible">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

