import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import InvoDashLogoMark from "./InvoDashLogoMark.jsx";
import { useLayoutScroll } from "../src/context/LayoutScrollContext.jsx";

const mainNavItems = [
  { id: "dashboard", label: "Dashboard", to: "/", end: true, icon: DashboardIcon },
  { id: "invoices", label: "Invoices", to: "/invoices", end: false, icon: InvoiceIcon },
  { id: "settings", label: "Settings", to: "/settings", end: false, icon: SettingsIcon },
];

/**
 * < lg: off-canvas drawer (w-64).
 * lg–xl: icon-only rail (w-20) with hover tooltips.
 * xl+: full labels (w-64).
 */
export default function SideNavigation() {
  const { sidebarOpen, closeSidebar } = useLayoutScroll();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeSidebar();
    };
    if (!sidebarOpen) return undefined;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={closeSidebar}
        className={[
          "fixed inset-0 z-40 bg-[#1A1E3B]/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        id="app-sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-gradient-to-b from-[#2D325A] to-[#1A1E3B] shadow-2xl transition-[width,transform] duration-300 ease-out",
          "w-64 p-6 lg:w-20 lg:p-3 xl:w-64 xl:p-6",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <BrandSection />
          <MenuSection onNavigate={closeSidebar} />
        </div>
      </aside>
    </>
  );
}

function BrandSection() {
  return (
    <div>
      <div className="flex items-center gap-3.5 lg:justify-center lg:gap-0 xl:justify-start xl:gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/5 p-0.5">
          <InvoDashLogoMark variant="onBlue" className="h-9 w-9" title="Invo Dash" />
        </div>
        <h2 className="text-base font-bold tracking-tight text-white md:text-xl lg:sr-only xl:not-sr-only xl:text-xl">
          Invo Dash
        </h2>
      </div>

      <hr className="mb-6 mt-6 border-white/10 lg:mb-4 lg:mt-4 xl:mb-6 xl:mt-6" />

      <p className="mb-4 text-[11px] font-normal tracking-[1.5px] text-white/40 lg:hidden xl:mb-4 xl:block">
        MAIN MENU
      </p>
    </div>
  );
}

function MenuSection({ onNavigate }) {
  const closeOnNavigate = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      onNavigate?.();
    }
  };

  return (
    <nav className="space-y-2">
      {mainNavItems.map((item) => (
        <NavItem key={item.id} item={item} onNavigate={closeOnNavigate} />
      ))}
    </nav>
  );
}

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <div className="group/nav relative">
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        title={item.label}
        className={({ isActive }) =>
          `flex w-full items-center gap-3 rounded-lg py-3 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/35 lg:justify-center lg:gap-0 lg:px-2 xl:justify-start xl:gap-3 xl:px-4 ${
            isActive ? "bg-[#2F51A1] text-white shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon active={isActive} />
            <span
              className={`text-sm lg:sr-only xl:not-sr-only ${isActive ? "font-bold" : "font-normal"}`}
            >
              {item.label}
            </span>
          </>
        )}
      </NavLink>

      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-[60] ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#101428] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/nav:opacity-100 lg:block xl:hidden"
      >
        {item.label}
      </span>
    </div>
  );
}

function DashboardIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={active ? "text-white" : "text-white/40 group-hover:text-white"}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function InvoiceIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={active ? "text-white" : "text-white/40 group-hover:text-white"}>
      <rect x="6" y="3.5" width="12" height="17" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9 9.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={active ? "text-white" : "text-white/40 group-hover:text-white"}>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
