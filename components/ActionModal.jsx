import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Centered overlay dialog — focus trap not included (portfolio scope).
 */
export default function ActionModal({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  tone = "default",
  footerMode = "default",
  maxWidthClass = "max-w-md",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const confirmClass = "bg-primary text-white hover:bg-primary-hover";
  void tone;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-[#0B1029]/45 backdrop-blur-[2px] transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[#ECECEC] bg-white p-6 shadow-[0px_20px_48px_rgba(48,57,115,0.18)] ${maxWidthClass}`.trim()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4">
          <h2 id="action-modal-title" className="min-w-0 flex-1 pr-8 text-lg font-semibold leading-snug text-[#17171B]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 shrink-0 rounded-lg p-2 text-[#828BB9] transition hover:bg-[#F5F7FF] hover:text-[#303973]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4 flex h-full min-h-0 flex-1 flex-col overflow-hidden text-sm leading-relaxed text-[#575E78]">
          {children}
        </div>

        {footerMode !== "none" ? (
          <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#ECECEC] bg-white p-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[#ECECEC] bg-white px-4 text-sm font-medium text-[#303973] shadow-sm transition hover:bg-[#F8F9FF]"
            >
              {cancelLabel}
            </button>
            {onConfirm ? (
              <button
                type="button"
                onClick={onConfirm}
                className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${confirmClass}`}
              >
                {confirmLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
