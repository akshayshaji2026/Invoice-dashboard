import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Download, FilePlus2, ListFilter, Search, Send } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLayoutScroll } from "../src/context/LayoutScrollContext.jsx";
import { useDashboardModal } from "../src/context/DashboardModalContext.jsx";
import { useInvoices } from "../src/context/InvoiceContext.jsx";
import { useSettings } from "../src/context/SettingsContext.jsx";
import { sendReminderBulkModalPayload } from "../src/pages/dashboardModalContent.jsx";

export default function Header({ title = "Dashboard", showAddInvoice = true }) {
  const {
    isScrolled,
    condensedHeader,
    invoiceListingHeaderActions,
    settingsToolbarSaveInView,
    addInvoiceFormActionsInView,
  } = useLayoutScroll();
  const location = useLocation();
  const isAddInvoiceRoute = location.pathname === "/add-invoice";
  const isDashboard = location.pathname === "/";
  const isInvoicesListing = location.pathname === "/invoices";

  const headerToolbarProps = {
    showAddInvoice,
    isScrolled,
    formCondensedSlot: condensedHeader,
    isDashboard,
    isInvoicesListing,
    invoiceListingHeaderActions,
    settingsToolbarSaveInView,
    addInvoiceFormActionsInView,
  };

  return (
    <header className="relative z-[60] flex w-full min-w-0 items-center gap-8 rounded-[16px] border border-[#ECECEC]/90 bg-white/80 p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.1)] backdrop-blur-md backdrop-saturate-150">
      <LeftSection
        title={title}
        isAddInvoiceRoute={isAddInvoiceRoute}
        isInvoicesListing={isInvoicesListing}
        isScrolled={isScrolled}
      />

      <HeaderSearchActionsGroup {...headerToolbarProps} />

      <HeaderProfileTrailing />
    </header>
  );
}

function LeftSection({ title, isAddInvoiceRoute, isInvoicesListing, isScrolled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsRoute = location.pathname === "/settings";
  const showBack =
    (isAddInvoiceRoute && isScrolled) || (isInvoicesListing && isScrolled) || (isSettingsRoute && isScrolled);
  const showHamburger = !showBack;

  const handleLeftClick = () => {
    if (!showBack) return;
    if (isAddInvoiceRoute && isScrolled) {
      navigate("/invoices");
      return;
    }
    if (isInvoicesListing && isScrolled) {
      navigate(-1);
      return;
    }
    if (isSettingsRoute && isScrolled) {
      navigate("/");
    }
  };

  const leftAriaLabel = showBack
    ? isAddInvoiceRoute
      ? "Back to invoices list"
      : isSettingsRoute
        ? "Back to dashboard"
        : "Back"
    : "Open menu";

  return (
    <div className="flex min-w-[200px] max-w-[min(40vw,320px)] shrink-0 items-center gap-4">
      <button
        type="button"
        onClick={handleLeftClick}
        className="relative h-6 w-6 shrink-0 rounded-md text-[#828BB9] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2"
        aria-label={leftAriaLabel}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
            showHamburger
              ? "pointer-events-auto translate-x-0 rotate-0 opacity-100"
              : "pointer-events-none translate-x-1 rotate-90 opacity-0"
          }`}
          aria-hidden={!showHamburger}
        >
          <HamburgerIcon />
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
            showBack
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-2 opacity-0"
          }`}
          aria-hidden={!showBack}
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        </span>
      </button>
      <h1 className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[20px] font-medium leading-none text-text-primary">
        {title}
      </h1>
    </div>
  );
}

/** `isScrolled` here means "expanded / visible" for the mirrored toolbar (not main page scroll depth). */
function CondensedWrap({ isScrolled, slotControlsMotion = false, children }) {
  const outerWidth = `min-w-0 shrink-0 overflow-hidden transition-all duration-300 ease-out ${
    isScrolled ? "max-w-none" : "max-w-0"
  }`;

  if (slotControlsMotion) {
    return (
      <div className={outerWidth} aria-hidden={!isScrolled}>
        {children}
      </div>
    );
  }

  return (
    <div className={outerWidth} aria-hidden={!isScrolled}>
      <div
        className={`flex shrink-0 transform items-center gap-2 whitespace-nowrap pr-0 transition-all duration-300 ease-out ${
          isScrolled
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

const iconGhostBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E9F0] bg-white text-[#303973] shadow-[0px_1px_2px_rgba(48,57,115,0.06)] transition hover:bg-[#F5F7FF] hover:border-[#D4D8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

function InvoiceListingCondensedActions({ actions }) {
  const navigate = useNavigate();
  const filtersOpen = Boolean(actions?.filtersVisible);

  return (
    <>
      <button
        type="button"
        className={iconGhostBtn}
        aria-label="Toggle filters"
        aria-pressed={filtersOpen}
        onClick={() => actions?.toggleFilters?.()}
      >
        <ListFilter className="h-4 w-4" strokeWidth={1.85} aria-hidden />
      </button>
      <button
        type="button"
        className={iconGhostBtn}
        aria-label="Export invoices"
        onClick={() => actions?.exportCsv?.()}
      >
        <Download className="h-4 w-4" strokeWidth={1.85} aria-hidden />
      </button>
      <button
        type="button"
        className={`${iconGhostBtn} border-[#2F51A1]/25 bg-[#2F51A1]/10 text-[#2F51A1] hover:bg-[#2F51A1]/15`}
        aria-label="Add invoice"
        onClick={() => navigate("/add-invoice")}
      >
        <FilePlus2 className="h-4 w-4" strokeWidth={1.85} aria-hidden />
      </button>
    </>
  );
}

function useHeaderToolbarState({
  showAddInvoice,
  isScrolled,
  formCondensedSlot,
  isDashboard,
  isInvoicesListing,
  invoiceListingHeaderActions,
  settingsToolbarSaveInView,
  addInvoiceFormActionsInView,
}) {
  const location = useLocation();
  const isSettingsRoute = location.pathname === "/settings";
  const isAddInvoiceRoute = location.pathname === "/add-invoice";

  const dashboardCondensed =
    isDashboard && showAddInvoice ? (
      <>
        <SendReminderButton />
        <AddInvoiceNavButton />
      </>
    ) : null;

  const invoicesCondensed = isInvoicesListing ? (
    <InvoiceListingCondensedActions actions={invoiceListingHeaderActions} />
  ) : null;

  let compactToolbarChildren = null;
  if (formCondensedSlot) {
    compactToolbarChildren = formCondensedSlot;
  } else if (isInvoicesListing && invoiceListingHeaderActions) {
    compactToolbarChildren = invoicesCondensed;
  } else if (dashboardCondensed) {
    compactToolbarChildren = dashboardCondensed;
  }

  const condensedSlotExpanded =
    formCondensedSlot && isSettingsRoute
      ? isScrolled || !settingsToolbarSaveInView
      : formCondensedSlot && isAddInvoiceRoute
        ? !addInvoiceFormActionsInView
        : isScrolled;

  const formMirrorInHeader = Boolean(formCondensedSlot);

  return {
    compactToolbarChildren,
    condensedSlotExpanded,
    formMirrorInHeader,
    isAddInvoiceRoute,
    isSettingsRoute,
  };
}

function SendReminderButton() {
  const { openModal } = useDashboardModal();
  const { invoices, overdueReminderCount, bulkOverdueRemindersAcknowledged } = useInvoices();
  const { settings } = useSettings();
  const reminderBadgeCount =
    settings.preferences.aiRemindersEnabled && !bulkOverdueRemindersAcknowledged ? overdueReminderCount : 0;

  return (
    <button
      type="button"
      onClick={() => openModal(sendReminderBulkModalPayload(invoices, 8))}
      className="h-9 shrink-0 rounded-xl bg-[#FFF8F1] px-3 flex items-center gap-1.5 text-[#D97E1C] text-xs font-normal hover:opacity-90 transition sm:text-sm"
    >
      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      <span className="hidden sm:inline">Send Reminder</span>
      <span className="sm:hidden">Reminder</span>
      {reminderBadgeCount > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#CE2222] px-1 text-[10px] font-medium leading-none text-white">
          {reminderBadgeCount}
        </span>
      ) : null}
    </button>
  );
}

function AddInvoiceNavButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/add-invoice")}
      className="h-9 shrink-0 rounded-xl bg-[#2F51A1] px-3 flex items-center gap-1.5 text-white text-xs font-normal transition hover:bg-[#254278] sm:px-3.5 sm:text-sm"
    >
      <FilePlus2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      <span>Add Invoice</span>
    </button>
  );
}

/** Search + condensed actions: search left, buttons slide in on the right. */
function HeaderSearchActionsGroup(props) {
  const { compactToolbarChildren, condensedSlotExpanded, formMirrorInHeader, isAddInvoiceRoute } =
    useHeaderToolbarState(props);

  let actionContent = null;

  if (compactToolbarChildren) {
    if (formMirrorInHeader) {
      if (isAddInvoiceRoute) {
        if (condensedSlotExpanded) {
          actionContent = (
            <div className="relative z-[60] flex shrink-0 items-center gap-2">{compactToolbarChildren}</div>
          );
        }
      } else {
        actionContent = (
          <CondensedWrap isScrolled={condensedSlotExpanded} slotControlsMotion>
            {compactToolbarChildren}
          </CondensedWrap>
        );
      }
    } else if (condensedSlotExpanded) {
      actionContent = (
        <CondensedWrap isScrolled={condensedSlotExpanded} slotControlsMotion={false}>
          {compactToolbarChildren}
        </CondensedWrap>
      );
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
      <SearchBar />
      {actionContent}
    </div>
  );
}

/** Notifications and profile — pinned at the far right. */
function HeaderProfileTrailing() {
  return (
    <div className="flex shrink-0 items-center gap-2 lg:gap-2.5">
      <button
        type="button"
        className="h-6 w-6 shrink-0 text-[#828BB9] transition hover:opacity-80 focus:outline-none"
        aria-label="Notifications"
      >
        <NotificationIcon />
      </button>

      <div className="hidden h-10 w-px shrink-0 bg-[#ECECEC] sm:block" />

      <ProfileMenu />
    </div>
  );
}

/** Panel shell aligned with CustomDropdown menu (rounded-xl, border, shadow-xl) */
const profileMenuShellClass =
  "absolute right-0 z-[70] mt-2 min-w-[16rem] w-64 overflow-hidden rounded-xl border border-[#F0F0F0] bg-white shadow-xl";

const profileMenuItemClass =
  "flex w-full items-center px-4 py-2.5 text-left text-sm font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[#303973] transition-colors duration-150 hover:bg-[#2F51A1]/[0.06] hover:text-[#2F51A1]";

const profileMenuLogoutClass =
  "flex w-full items-center px-4 py-2.5 text-left text-sm font-[Inter,ui-sans-serif,system-ui,sans-serif] text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600";

function ProfileMenu() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const p = settings.profile;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg py-1 pl-1 pr-1 text-left transition hover:bg-[#F5F7FF] sm:gap-3 sm:pr-2"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <img
          src={p.avatarUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full border border-[#ECECEC] object-cover sm:h-10 sm:w-10"
        />
        <div className="hidden min-w-0 leading-none sm:block">
          <p className="truncate text-sm font-medium text-text-primary">{p.displayName}</p>
          <p className="mt-1 truncate text-[10px] font-medium text-[#2F51A1]">{p.roleLabel}</p>
        </div>
        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-[#828BB9] transition-[transform,color] duration-200 sm:block ${
            open ? "rotate-180 text-[#2F51A1]" : ""
          }`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <div className={profileMenuShellClass} role="menu">
          <div className="border-b border-[#F0F0F0] px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-[#ECECEC] object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1C1C1C]">{p.displayName}</p>
                <p className="truncate text-xs font-medium text-[#2F51A1]">{p.roleLabel}</p>
              </div>
            </div>
          </div>
          <Link
            to="/settings#general"
            role="menuitem"
            className={profileMenuItemClass}
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
          <Link
            to="/settings#company"
            role="menuitem"
            className={profileMenuItemClass}
            onClick={() => setOpen(false)}
          >
            Company Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className={profileMenuLogoutClass}
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SearchBar() {
  const { searchQuery, setSearchQuery } = useLayoutScroll();

  return (
    <div className="min-w-0 max-w-[400px] flex-1">
      <div className="flex h-10 w-full items-center gap-2 rounded-2xl border border-[#ECECEC] bg-white px-4 shadow-[0px_0px_2px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-[#E4E4E7] focus-within:border-[#2F51A1] focus-within:shadow-[0_0_0_3px_rgba(47,81,161,0.12)]">
        <Search className="h-5 w-5 shrink-0 text-[#828BB9]" strokeWidth={1.6} aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Invoices, Clients"
          aria-label="Search invoices and clients"
          className="w-full min-w-0 border-none bg-transparent text-sm text-[#1C1C1C] placeholder:text-[#B1B1C2] focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17H9C8.45 17 8 16.55 8 16V11.8C8 9.2 9.8 7 12 7C14.2 7 16 9.2 16 11.8V16C16 16.55 15.55 17 15 17Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M10 18.5C10.3 19.4 11.1 20 12 20C12.9 20 13.7 19.4 14 18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18.5" cy="6.5" r="2.2" fill="#F04438" />
    </svg>
  );
}
