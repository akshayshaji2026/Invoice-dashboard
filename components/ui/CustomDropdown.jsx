import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const labelClass =
  "font-[Inter,ui-sans-serif,system-ui,sans-serif] text-xs font-medium text-[#B1B1C2]";

const triggerBase =
  "flex w-full items-center justify-between rounded-xl border border-[#ECECEC] bg-white px-4 text-sm font-medium text-[#1C1C1C] shadow-[0px_1px_8px_rgba(54,76,215,0.1)] transition hover:bg-[#F5F7FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 font-[Inter,ui-sans-serif,system-ui,sans-serif]";

const menuClass =
  "absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#F0F0F0] bg-white shadow-lg";

/**
 * Dropdown with document click-outside (via ref) and Escape to close.
 * Trigger uses type="button" so it never submits a parent form.
 */
export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  size = "md",
  align = "left",
  disabled = false,
  /** `(close) => ReactNode` — e.g. footer actions; call `close()` to collapse the menu. */
  menuFooter = null,
}) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected?.label ?? placeholder;
  const heightClass = size === "sm" ? "h-10" : "h-11";
  const alignClass = align === "right" ? "right-0" : "left-0";

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    // Capture phase so outside-close runs before another control’s handlers; each instance has its own ref + isOpen.
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={`${triggerBase} ${heightClass} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span className="min-w-0 truncate text-left">{selectedLabel}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-[#828BB9] transition-[transform,color] duration-200 ${
            isOpen ? "rotate-180 text-[#2F51A1]" : ""
          }`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {isOpen && !disabled ? (
        <div className={`${menuClass} ${alignClass}`} role="listbox">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer px-4 py-2.5 text-left text-sm font-[Inter,ui-sans-serif,system-ui,sans-serif] transition-colors duration-150 ${
                  value === option.value
                    ? "bg-[#2F51A1]/05 font-semibold text-[#2F51A1] hover:bg-gray-50"
                    : "text-[#303973] hover:bg-gray-50 hover:text-[#2F51A1]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {typeof menuFooter === "function"
            ? menuFooter(() => setIsOpen(false))
            : menuFooter}
        </div>
      ) : null}
    </div>
  );
}

export { labelClass };
