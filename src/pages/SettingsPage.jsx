import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, Plus, X } from "lucide-react";
import MainLayout from "../layouts/MainLayout.jsx";
import { useSettings, DEFAULT_SETTINGS } from "../context/SettingsContext.jsx";
import { useLayoutScroll, useSetCondensedHeader } from "../context/LayoutScrollContext.jsx";

const inputClass =
  "w-full rounded-xl border border-[#E8E8EC] bg-white px-4 py-2.5 text-sm text-[#1C1C1C] shadow-[0px_0px_2px_rgba(48,57,115,0.06)] placeholder:text-[#B1B1C2] focus:border-[#E8E8EC] focus:outline-none focus:ring-0 focus-visible:ring-0 hover:border-[#E8E8EC]";

const labelClass = "mb-2 block text-xs font-medium text-[#B1B1C2]";

const cardClass =
  "rounded-[16px] border border-[#ECECEC] bg-white p-5 shadow-[0px_1px_8px_rgba(54,76,215,0.1)]";

/** Matches Activity Feed panel title */
const sectionTitleClass =
  "text-[18px] leading-[1.2] font-semibold text-[#17171B] font-['Inter'] tracking-[-0.03em]";

/** Same pattern as invoice listing filter tabs (InvoicesListingPage.jsx) */
const settingsTabBtnBase =
  "-mb-px rounded-t-md border-b-2 px-2 pb-3 pt-1 text-sm transition-all duration-200";
const settingsTabActive = "border-[#2F51A1] text-[#2F51A1] font-semibold";
const settingsTabInactive =
  "border-transparent font-medium text-[#71717A] hover:bg-[#2F51A1]/[0.06] hover:text-[#52525B]";

const TABS = [
  { id: "general", label: "General" },
  { id: "company", label: "Company" },
  { id: "billing", label: "Billing & AI" },
];

function hashToTabId(hash) {
  const raw = (hash || "").replace(/^#/, "").toLowerCase();
  if (raw === "company") return "company";
  if (raw === "billing" || raw === "preferences" || raw === "billing-ai") return "billing";
  if (raw === "general" || raw === "profile" || raw === "security") return "general";
  return "general";
}

function tabIdToHash(id) {
  if (id === "company") return "company";
  if (id === "billing") return "billing";
  return "general";
}

/** Custom upload (data URL) or non-default remote avatar */
function hasCustomProfilePicture(avatarUrl) {
  if (!avatarUrl) return false;
  if (avatarUrl.startsWith("data:")) return true;
  return avatarUrl !== DEFAULT_SETTINGS.profile.avatarUrl;
}

function SectionCard({ id, title, children }) {
  return (
    <section id={id} className={cardClass}>
      <h2 className={`mb-5 ${sectionTitleClass}`}>{title}</h2>
      {children}
    </section>
  );
}

function addDaysIso(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10);
}

function SavedStatus() {
  return (
    <span
      className="inline-flex animate-slide-up items-center gap-1.5 text-sm font-medium text-green-600"
      role="status"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} aria-hidden />
      Saved
    </span>
  );
}

/** ~80×80 drop zone + preview with remove overlay */
function VisualUploadBox({ inputId, filled, previewSrc, onInputChange, onRemove, dropLabel, objectFit = "cover" }) {
  const [dragOver, setDragOver] = useState(false);

  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    onInputChange({ target: { files: dt.files } });
  };

  return (
    <div
      className="relative inline-block"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        applyFile(e.dataTransfer.files?.[0]);
      }}
    >
      <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={onInputChange} />
      {filled ? (
        <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#ECECEC] bg-white">
          <img
            src={previewSrc}
            alt=""
            className={`h-full w-full ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
          />
          <button
            type="button"
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md ring-1 ring-black/5 transition hover:bg-white hover:text-red-700"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={[
            "flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 transition",
            dragOver ? "border-[#2F51A1] bg-[#F5F7FF]" : "border-blue-200",
          ].join(" ")}
        >
          <Plus className="h-8 w-8 text-[#2F51A1]" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">{dropLabel}</span>
        </label>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const location = useLocation();
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState(settings);
  const [savedFlash, setSavedFlash] = useState(false);
  const [savedFlashKey, setSavedFlashKey] = useState(0);
  const [activeTab, setActiveTab] = useState(() => hashToTabId(location.hash));
  const { mainScrollRef, setSettingsToolbarSaveInView, settingsToolbarSaveInView } = useLayoutScroll();
  const setCondensedHeader = useSetCondensedHeader();
  const saveActionsRef = useRef({ handleSave: () => {} });
  const settingsToolbarRef = useRef(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setActiveTab(hashToTabId(location.hash));
  }, [location.hash]);

  useEffect(() => {
    const root = mainScrollRef.current;
    const el = settingsToolbarRef.current;
    if (!root || !el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        setSettingsToolbarSaveInView(entry.isIntersecting);
      },
      { root, rootMargin: "0px 0px 0px 0px", threshold: [0, 0.01, 0.1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setSettingsToolbarSaveInView(true);
    };
  }, [mainScrollRef, setSettingsToolbarSaveInView, activeTab]);

  const setTab = useCallback(
    (id) => {
      setActiveTab(id);
      const next = `#${tabIdToHash(id)}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, "", `${location.pathname}${location.search}${next}`);
      }
    },
    [location.pathname, location.search],
  );

  const merge = useCallback((section, patch) => {
    setDraft((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  }, []);

  const handleSave = useCallback(() => {
    updateSettings({
      profile: { ...draft.profile },
      company: { ...draft.company },
      preferences: { ...draft.preferences },
    });
    setSavedFlashKey((k) => k + 1);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 3000);
  }, [draft, updateSettings]);

  saveActionsRef.current = { handleSave };

  useEffect(() => {
    setCondensedHeader(
      <div className="flex shrink-0 items-center gap-2">
        {savedFlash ? <SavedStatus key={savedFlashKey} /> : null}
        <button
          type="button"
          onClick={() => saveActionsRef.current.handleSave()}
          className="h-9 shrink-0 rounded-xl bg-[#2F51A1] px-4 text-sm font-normal text-white transition hover:bg-[#254278]"
        >
          Save Changes
        </button>
      </div>,
    );
    return () => setCondensedHeader(null);
  }, [setCondensedHeader, savedFlash, savedFlashKey]);

  const onLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      merge("preferences", { logoDataUrl: url, useCompanyLogo: true });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      merge("profile", { avatarUrl: url });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const duePreview = useMemo(
    () => addDaysIso(new Date().toISOString().slice(0, 10), draft.preferences.defaultDueDays),
    [draft.preferences.defaultDueDays],
  );

  const hasLogo = Boolean(draft.preferences.logoDataUrl);
  const profileFilled = hasCustomProfilePicture(draft.profile.avatarUrl);
  const profilePreviewSrc = draft.profile.avatarUrl || DEFAULT_SETTINGS.profile.avatarUrl;
  const hasCustomLogo = hasLogo;
  const logoSwitchDisabled = hasCustomLogo;
  const useCompanyLogoOn = draft.preferences.useCompanyLogo !== false;
  const logoSwitchChecked = logoSwitchDisabled ? true : useCompanyLogoOn;

  return (
    <MainLayout title="Settings" showAddInvoice={false}>
      <div className="space-y-6">
        <div
          ref={settingsToolbarRef}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-[#828BB9]">
            Manage your profile, company details shown on invoices, and billing preferences.
          </p>
          <div className="flex min-h-[44px] items-center justify-end gap-3">
            {settingsToolbarSaveInView ? (
              <>
                {savedFlash ? <SavedStatus key={savedFlashKey} /> : null}
                <button
                  type="button"
                  onClick={handleSave}
                  className="h-11 shrink-0 rounded-xl bg-[#2F51A1] px-5 text-sm font-normal text-white transition hover:bg-[#254278]"
                >
                  Save Changes
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-b border-[#F0F0F0] pb-px">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={[settingsTabBtnBase, active ? settingsTabActive : settingsTabInactive].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {activeTab === "general" ? (
            <>
              <SectionCard id="profile" title="Profile settings">
                <div className="space-y-4">
                  <label className="block">
                    <span className={labelClass}>Name</span>
                    <input
                      type="text"
                      value={draft.profile.displayName}
                      onChange={(e) => merge("profile", { displayName: e.target.value })}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Email</span>
                    <input
                      type="email"
                      value={draft.profile.email}
                      onChange={(e) => merge("profile", { email: e.target.value })}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </label>
                  <div>
                    <span className={labelClass}>Profile picture</span>
                    <div className="mt-2">
                      <VisualUploadBox
                        inputId="settings-avatar-file"
                        filled={profileFilled}
                        previewSrc={profilePreviewSrc}
                        onInputChange={onAvatarFile}
                        onRemove={() => merge("profile", { avatarUrl: DEFAULT_SETTINGS.profile.avatarUrl })}
                        dropLabel="Upload profile picture"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard id="security" title="Security">
                <p className="text-sm text-[#828BB9]">
                  Password and two-factor authentication would be configured here in a production deployment.
                </p>
              </SectionCard>
            </>
          ) : null}

          {activeTab === "company" ? (
            <SectionCard id="company" title="Company details">
              <p className="mb-4 text-xs text-[#828BB9]">
                Shown in the <span className="font-medium text-[#303973]">From</span> block on invoice preview and new
                invoices.
              </p>
              <div className="space-y-4">
                <label className="block">
                  <span className={labelClass}>Business name</span>
                  <input
                    type="text"
                    value={draft.company.businessName}
                    onChange={(e) => merge("company", { businessName: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Address line 1</span>
                  <input
                    type="text"
                    value={draft.company.addressLine1}
                    onChange={(e) => merge("company", { addressLine1: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Address line 2</span>
                  <input
                    type="text"
                    value={draft.company.addressLine2}
                    onChange={(e) => merge("company", { addressLine2: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>GST / Tax ID</span>
                  <input
                    type="text"
                    value={draft.company.gstTaxId}
                    onChange={(e) => merge("company", { gstTaxId: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Contact number</span>
                  <input
                    type="text"
                    value={draft.company.contactNumber}
                    onChange={(e) => merge("company", { contactNumber: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Billing email</span>
                  <input
                    type="email"
                    value={draft.company.billingEmail}
                    onChange={(e) => merge("company", { billingEmail: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Bank label</span>
                  <input
                    type="text"
                    value={draft.company.bankLabel}
                    onChange={(e) => merge("company", { bankLabel: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Bank details</span>
                  <textarea
                    rows={2}
                    value={draft.company.bankDetail}
                    onChange={(e) => merge("company", { bankDetail: e.target.value })}
                    className={`${inputClass} resize-none`}
                  />
                </label>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "billing" ? (
            <SectionCard id="preferences" title="Invoice preferences">
              <div className="space-y-5">
                <div>
                  <span className={labelClass}>Default due date</span>
                  <select
                    value={String(draft.preferences.defaultDueDays)}
                    onChange={(e) => merge("preferences", { defaultDueDays: Number(e.target.value) })}
                    className={inputClass}
                  >
                    <option value="7">7 days after issue date</option>
                    <option value="14">14 days after issue date</option>
                    <option value="30">30 days after issue date</option>
                  </select>
                  <p className="mt-1 text-xs text-[#828BB9]">Example from today: {duePreview || "—"}</p>
                </div>

                <div>
                  <span className={labelClass}>Default currency</span>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "INR", label: "₹ INR" },
                      { value: "USD", label: "$ USD" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => merge("preferences", { currency: opt.value })}
                        className={[
                          "rounded-xl border px-4 py-2 text-sm font-medium transition",
                          draft.preferences.currency === opt.value
                            ? "border-[#2F51A1] bg-[#2F51A1]/05 text-[#2F51A1]"
                            : "border-[#E8E8EC] bg-white text-[#303973] hover:border-[#E8E8EC]",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#F0F0F0] pt-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#303973]">Use Company Logo</p>
                      <p className="mt-1 text-xs text-[#828BB9]">
                        When off, invoices show no logo. When on without an upload, the default Invo Dash mark is
                        used. A custom upload keeps this on and locks the switch.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={logoSwitchChecked}
                      disabled={logoSwitchDisabled}
                      onClick={() => {
                        if (logoSwitchDisabled) return;
                        merge("preferences", { useCompanyLogo: !useCompanyLogoOn });
                      }}
                      className={[
                        "relative inline-flex h-7 w-12 shrink-0 rounded-full border border-transparent transition",
                        logoSwitchChecked ? "bg-[#2F51A1]" : "bg-[#E8E8EC]",
                        logoSwitchDisabled ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                          logoSwitchChecked ? "left-[calc(100%-1.375rem)]" : "left-0.5",
                        ].join(" ")}
                        aria-hidden
                      />
                    </button>
                  </div>

                  <span className={labelClass}>Invoice logo</span>
                  <p className="mb-2 text-xs text-[#828BB9]">Displayed on generated invoice header when enabled.</p>
                  <VisualUploadBox
                    inputId="settings-logo-file"
                    filled={hasLogo}
                    previewSrc={draft.preferences.logoDataUrl}
                    onInputChange={onLogoFile}
                    onRemove={() => merge("preferences", { logoDataUrl: "" })}
                    dropLabel="Upload invoice logo"
                    objectFit="contain"
                  />
                </div>

                <div className="border-t border-[#F0F0F0] pt-5">
                  <h3 className="mb-3 text-[16px] font-semibold text-[#17171B]">AI reminders</h3>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={draft.preferences.aiRemindersEnabled}
                      onChange={(e) => merge("preferences", { aiRemindersEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-[#ECECEC] text-[#2F51A1] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                    />
                    <span className="text-sm font-medium text-[#303973]">Automatic AI follow-ups</span>
                  </label>
                  <p className="mt-2 text-xs text-[#828BB9]">
                    When off, AI Insights action cards stay hidden until you turn this back on.
                  </p>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
