import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const triggerClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#1C1C1C] shadow-[0px_1px_8px_rgba(54,76,215,0.1)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-slate-300 focus:outline-none focus-visible:border-slate-400 focus-visible:shadow-[0_0_0_3px_rgba(47,81,161,0.14)] font-[Inter,ui-sans-serif,system-ui,sans-serif]";

const menuClass =
  "absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[#F0F0F0] bg-white p-4 shadow-xl";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIsoDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso) {
  const d = parseIsoDate(iso);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function buildMonthGrid(viewYear, viewMonth) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  const cells = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      outside: d.getMonth() !== viewMonth,
    });
  }

  return cells;
}

function CalendarPanel({ viewDate, selectedIso, onSelect, onViewChange }) {
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const todayIso = toIsoDate(new Date());

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + delta);
    onViewChange(next);
  };

  return (
    <div role="dialog" aria-label="Choose date">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#828BB9] transition hover:bg-[#2F51A1]/10 hover:text-[#2F51A1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
        <span className="text-sm font-semibold text-[#303973]">{monthLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#828BB9] transition hover:bg-[#2F51A1]/10 hover:text-[#2F51A1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#B1B1C2]"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date, outside }) => {
          const iso = toIsoDate(date);
          const isSelected = selectedIso === iso;
          const isToday = todayIso === iso;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(date)}
              className={[
                "flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/30",
                outside ? "text-[#C5C9D8]" : "text-[#303973]",
                isSelected
                  ? "bg-[#2F51A1] text-white shadow-sm hover:bg-[#254278]"
                  : "hover:bg-[#2F51A1]/10 hover:text-[#2F51A1]",
                !isSelected && isToday ? "ring-1 ring-inset ring-[#2F51A1]/40" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end border-t border-[#F0F0F0] pt-3">
        <button
          type="button"
          onClick={() => onSelect(new Date())}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#2F51A1] transition hover:bg-[#2F51A1]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F51A1]/25"
        >
          Today
        </button>
      </div>
    </div>
  );
}

/** Themed date picker — matches {@link CustomDropdown} trigger; custom calendar popover (not native). */
export const FormDateInput = forwardRef(function FormDateInput(
  { value = "", onChange, className = "", disabled = false, placeholder = "Select date", id, name },
  ref,
) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseIsoDate(value) || new Date());

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) setViewDate(parsed);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const display = formatDisplay(value);

  const emitChange = (iso) => {
    onChange?.({ target: { value: iso, name } });
  };

  const handleSelect = (date) => {
    emitChange(toIsoDate(date));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        ref={ref}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${triggerClass} h-11 min-h-[2.75rem] w-full ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span className={`min-w-0 truncate text-left ${display ? "text-[#1C1C1C]" : "text-[#B1B1C2]"}`}>
          {display || placeholder}
        </span>
        <Calendar
          className={`h-4 w-4 shrink-0 ${open ? "text-[#2F51A1]" : "text-[#828BB9] opacity-60"}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && !disabled ? (
        <div className={menuClass}>
          <CalendarPanel
            viewDate={viewDate}
            selectedIso={value}
            onSelect={handleSelect}
            onViewChange={setViewDate}
          />
        </div>
      ) : null}
    </div>
  );
});

/** @deprecated Native input classes — use themed {@link FormDateInput} instead. */
export const formDateInputClassName = triggerClass;
