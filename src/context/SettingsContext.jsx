import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "invodash.settings.v1";

export const DEFAULT_SETTINGS = {
  profile: {
    displayName: "John Smith",
    email: "john.smith@invodash.app",
    avatarUrl: "https://ui-avatars.com/api/?name=John+Smith&background=303973&color=fff",
    roleLabel: "Admin",
  },
  company: {
    businessName: "Invo Dash Pvt Ltd",
    addressLine1: "Technopark Phase 3, Kochi",
    addressLine2: "Kerala 682030, India",
    contactNumber: "+91 484 000 0000",
    billingEmail: "billing@invodash.app",
    gstTaxId: "32AABCUXXXX1234ZX",
    bankLabel: "HDFC Bank — Invo Dash Current A/C",
    bankDetail: "NEFT / RTGS: IFSC HDFC0001234 • A/C 50200012345678",
  },
  preferences: {
    defaultDueDays: 7,
    currency: "INR",
    logoDataUrl: "",
    useCompanyLogo: true,
    aiRemindersEnabled: true,
  },
};

function loadStored() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile },
      company: { ...DEFAULT_SETTINGS.company, ...parsed.company },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...parsed.preferences },
    };
  } catch {
    return null;
  }
}

function persist(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota */
  }
}

/** Invoice header logo: custom upload wins; else respects useCompanyLogo */
export function getInvoiceLogoMode(settings) {
  const p = { ...DEFAULT_SETTINGS.preferences, ...settings?.preferences };
  if (p.logoDataUrl) return "custom";
  if (!p.useCompanyLogo) return "none";
  return "default";
}

/** Shape used by invoice header “From” block */
export function getCompanyFromBlock(settings) {
  const c = settings?.company ?? DEFAULT_SETTINGS.company;
  return {
    name: c.businessName || DEFAULT_SETTINGS.company.businessName,
    line1: c.addressLine1 || "",
    line2: c.addressLine2 || "",
    phone: c.contactNumber || "",
    email: c.billingEmail || "",
    gstin: c.gstTaxId || "",
    bank: c.bankLabel || "",
    bankDetail: c.bankDetail || "",
  };
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadStored() ?? DEFAULT_SETTINGS);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = {
        profile: { ...prev.profile, ...(partial.profile || {}) },
        company: { ...prev.company, ...(partial.company || {}) },
        preferences: { ...prev.preferences, ...(partial.preferences || {}) },
      };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
