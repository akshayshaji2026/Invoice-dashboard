import React from "react";
import { NavLink } from "react-router-dom";
import InvoDashLogoMark from "./InvoDashLogoMark.jsx";

const mainNavItems = [
  { id: "dashboard", label: "Dashboard", to: "/", end: true, icon: DashboardIcon },
  { id: "invoices", label: "Invoices", to: "/invoices", end: false, icon: InvoiceIcon },
];

export default function SideNavigation() {
  return (
    <aside className="fixed left-6 top-6 z-50 h-[calc(100vh-48px)] w-64 overflow-hidden rounded-2xl bg-gradient-to-b from-[#2D325A] to-[#1A1E3B] p-6 shadow-2xl">
      <div className="flex h-full flex-col">
        <BrandSection />
        <MenuSection />
      </div>
    </aside>
  );
}

function BrandSection() {
  return (
    <div>
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/5 p-0.5">
          <InvoDashLogoMark variant="onBlue" className="h-9 w-9" title="Invo Dash" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Invo Dash</h2>
      </div>

      <hr className="mb-6 mt-6 border-white/10" />

      <p className="mb-4 text-[11px] font-normal tracking-[1.5px] text-white/40">MAIN MENU</p>
    </div>
  );
}

function MenuSection() {
  return (
    <nav className="space-y-2">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/35 ${
                isActive ? "bg-[#2F51A1] text-white shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span className={`text-sm ${isActive ? "font-bold" : "font-normal"}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/35 ${
            isActive ? "bg-[#2F51A1] text-white shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <SettingsIcon active={isActive} />
            <span className={`text-sm ${isActive ? "font-bold" : "font-normal"}`}>Settings</span>
          </>
        )}
      </NavLink>
    </nav>
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
