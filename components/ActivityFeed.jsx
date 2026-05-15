import React from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useInvoices } from "../src/context/InvoiceContext.jsx";

const activityInvoiceLinkClass =
  "cursor-pointer font-semibold text-[#2F51A1] underline-offset-2 transition-colors hover:underline";

function renderMessageWithInvoiceLinks(message) {
  const parts = message.split(/(INV-\d+)/g);

  return parts.map((part, idx) => {
    if (!/^INV-\d+$/.test(part)) {
      return <span key={`${part}-${idx}`}>{part}</span>;
    }

    return (
      <Link
        key={`${part}-${idx}`}
        to={`/invoices/view/${encodeURIComponent(part)}`}
        className={activityInvoiceLinkClass}
      >
        {part}
      </Link>
    );
  });
}

export default function ActivityFeed() {
  const { activityFeed } = useInvoices();

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
      <header className="mb-5">
        <h3 className="text-[18px] leading-[1.2] font-semibold tracking-[-0.03em] text-[#17171B] font-['Inter',ui-sans-serif,system-ui,sans-serif]">
          Activity Feed
        </h3>
      </header>

      <div className="relative h-[360px] min-h-0">
        {/* Scrollable Area */}
        <div className="h-full overflow-y-auto pr-1 pt-1 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute bottom-3 left-3 top-3 w-px bg-[#ECECEC]" />

            <div className="space-y-5">
              {activityFeed.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Icon Circle */}
                  <div className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
                    <Clock className="h-3.5 w-3.5 text-[#3B82F6]" strokeWidth={1.85} aria-hidden />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="text-sm font-normal leading-snug text-[#B1B1C2]">
                      {renderMessageWithInvoiceLinks(item.message)}
                    </div>
                    <div className="mt-2 text-xs font-medium text-[#A0A3BD]">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradient Fades for Scroll Indicators */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>
    </section>
  );
}