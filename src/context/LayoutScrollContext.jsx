import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

/** Scroll past welcome / hero triggers condensed header CTAs */
const SCROLL_CONDENSED_THRESHOLD_PX = 80;

const LayoutScrollContext = createContext(null);

export function LayoutScrollProvider({ children }) {
  const location = useLocation();
  const mainScrollRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [condensedHeader, setCondensedHeader] = useState(null);
  /** Set by {@link InvoicesListingPage} so the global Header can toggle filters / export while scrolled. */
  const [invoiceListingHeaderActions, setInvoiceListingHeaderActions] = useState(null);
  /** Settings: primary toolbar (Save row) visible inside main scroll — drives header Save when scrolled out */
  const [settingsToolbarSaveInView, setSettingsToolbarSaveInView] = useState(true);
  /** Add invoice: Preview / Save / Send row visible in the form body */
  const [addInvoiceFormActionsInView, setAddInvoiceFormActionsInView] = useState(true);
  /** Add invoice: mirror Preview / Save / Send in header when main scroll passes threshold */
  const [showAddInvoiceHeaderActions, setShowAddInvoiceHeaderActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const onMainScroll = useCallback((e) => {
    setIsScrolled(e.currentTarget.scrollTop > SCROLL_CONDENSED_THRESHOLD_PX);
  }, []);

  const resetMainScroll = useCallback(() => {
    setCondensedHeader(null);
    setIsScrolled(false);
    setSettingsToolbarSaveInView(true);
    setAddInvoiceFormActionsInView(true);
    setShowAddInvoiceHeaderActions(false);
    setSearchQuery("");
    setSidebarOpen(false);
    const el = mainScrollRef.current;
    if (el) el.scrollTop = 0;
  }, []);

  /** Layout phase so scroll/header reset runs before child `useEffect` (e.g. Add Invoice `setCondensedHeader`). A passive pathname effect would run after children and wipe `condensedHeader`. */
  useLayoutEffect(() => {
    resetMainScroll();
  }, [location.pathname, resetMainScroll]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (location.pathname !== "/invoices") {
      setInvoiceListingHeaderActions(null);
    }
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      isScrolled,
      condensedHeader,
      setCondensedHeader,
      invoiceListingHeaderActions,
      setInvoiceListingHeaderActions,
      mainScrollRef,
      onMainScroll,
      settingsToolbarSaveInView,
      setSettingsToolbarSaveInView,
      addInvoiceFormActionsInView,
      setAddInvoiceFormActionsInView,
      showAddInvoiceHeaderActions,
      setShowAddInvoiceHeaderActions,
      searchQuery,
      setSearchQuery,
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
    }),
    [
      isScrolled,
      condensedHeader,
      invoiceListingHeaderActions,
      onMainScroll,
      settingsToolbarSaveInView,
      addInvoiceFormActionsInView,
      showAddInvoiceHeaderActions,
      searchQuery,
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
    ],
  );

  return <LayoutScrollContext.Provider value={value}>{children}</LayoutScrollContext.Provider>;
}

export function useLayoutScroll() {
  const ctx = useContext(LayoutScrollContext);
  if (!ctx) {
    throw new Error("useLayoutScroll must be used within LayoutScrollProvider");
  }
  return ctx;
}

/** Subsets for pages that should not depend on scroll ref registration */
export function useScrollDepth() {
  const { isScrolled } = useLayoutScroll();
  return { isScrolled };
}

export function useSetCondensedHeader() {
  return useLayoutScroll().setCondensedHeader;
}

export function useSetInvoiceListingHeaderActions() {
  return useLayoutScroll().setInvoiceListingHeaderActions;
}
