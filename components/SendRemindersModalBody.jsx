import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MessageSquare, Paperclip, Plus, X } from "lucide-react";
import { formatInvoiceINR } from "./invoiceTableShared.jsx";
import { useInvoices } from "../src/context/InvoiceContext.jsx";
import { useDashboardModal } from "../src/context/DashboardModalContext.jsx";
import { getReminderQueueFromInsight } from "../src/utils/getReminderQueueFromInsight.js";
import { getReminderDismissPayload } from "../src/utils/reminderInsightDismiss.js";

const sans = "font-[Inter,ui-sans-serif,system-ui,sans-serif]";

const DEFAULT_GLOBAL = `Dear @client,
I hope you are doing well. This is a friendly reminder that payment for @invoice in the amount of @amount is now overdue. Please arrange for payment by @duedate.
Best regards,
Accounts Team`;

const PLACEHOLDER_REGEX = /(@client|@invoice|@amount|@duedate)/g;

function newLocalId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `f-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDueDate(value) {
  if (!value) return "the due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "the due date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function resolveTemplate(globalTemplate, inv) {
  const base = String(globalTemplate || "");
  const replacements = {
    "@client": (inv?.client || "").trim() || "client",
    "@invoice": (inv?.number || inv?.id || "").trim() || "invoice",
    "@amount":
      typeof inv?.amount === "number" || Number(inv?.amount)
        ? formatInvoiceINR(Number(inv.amount))
        : "the outstanding amount",
    "@duedate": formatDueDate(inv?.dueDate),
  };

  return Object.entries(replacements).reduce(
    (text, [tag, replacement]) => text.replaceAll(tag, replacement),
    base,
  );
}

function composeBody(globalTemplate, inv) {
  return resolveTemplate(globalTemplate, inv).trim();
}

function formatEmail(inv) {
  if (inv.email?.trim()) return inv.email.trim();
  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getMentionHtml(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(
    PLACEHOLDER_REGEX,
    '<span style="color:#2F51A1;font-weight:600">$1</span>',
  );
}

function getCaretOffset(root) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.endContainer)) return 0;
  const pre = range.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function setCaretOffset(root, offset) {
  const selection = window.getSelection();
  if (!selection) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let remaining = Math.max(0, offset);
  let node = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= len;
    node = walker.nextNode();
  }
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export default function SendRemindersModalBody({ insight }) {
  const { invoices, acknowledgeRemindersSent } = useInvoices();
  const { closeModal } = useDashboardModal();
  const queue = useMemo(() => getReminderQueueFromInsight(insight, invoices), [insight, invoices]);

  const [globalTemplate, setGlobalTemplate] = useState(DEFAULT_GLOBAL);
  const [customMessages, setCustomMessages] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [globalFiles, setGlobalFiles] = useState([]);
  const [rowFiles, setRowFiles] = useState({});
  const [recipientOmitGlobal, setRecipientOmitGlobal] = useState({});
  const [selectedRecipients, setSelectedRecipients] = useState({});
  const [sendSuccess, setSendSuccess] = useState(false);
  const editedIdsRef = useRef(new Set());
  const globalFileRef = useRef(null);
  const globalEditorRef = useRef(null);
  const pendingCaretRef = useRef(null);
  const rowCardRefs = useRef({});
  const rowFileRefs = useRef({});

  const queueKey = useMemo(() => queue.map((q) => q.id).join(","), [queue]);
  const insightKey = insight?.id ?? "";

  useEffect(() => {
    editedIdsRef.current.clear();
    setSendSuccess(false);
    setGlobalFiles([]);
    setRowFiles({});
    setRecipientOmitGlobal({});
    if (!queue.length) {
      setCustomMessages({});
      setSelectedRecipients({});
      return;
    }
    setCustomMessages(
      Object.fromEntries(queue.map((inv) => [inv.id, composeBody(globalTemplate, inv)])),
    );
    setSelectedRecipients(Object.fromEntries(queue.map((inv) => [inv.id, true])));
  }, [queueKey, insightKey]);

  useEffect(() => {
    if (!queue.length) return;
    setCustomMessages((prev) => {
      const next = { ...prev };
      for (const inv of queue) {
        if (!editedIdsRef.current.has(inv.id)) {
          next[inv.id] = composeBody(globalTemplate, inv);
        }
      }
      return next;
    });
  }, [globalTemplate, queue, queueKey]);

  useLayoutEffect(() => {
    const editor = globalEditorRef.current;
    if (!editor) return;
    const nextHtml = getMentionHtml(globalTemplate).replaceAll("\n", "<br/>");
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
    if (pendingCaretRef.current != null && document.activeElement === editor) {
      setCaretOffset(editor, pendingCaretRef.current);
      pendingCaretRef.current = null;
    }
  }, [globalTemplate]);

  useEffect(() => {
    if (!expandedId) return;
    const onOutside = (event) => {
      const activeCard = rowCardRefs.current[expandedId];
      if (!activeCard) return;
      if (activeCard.contains(event.target)) return;
      setExpandedId(null);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [expandedId]);

  const selectedList = useMemo(
    () => queue.filter((inv) => selectedRecipients[inv.id] === true),
    [queue, selectedRecipients],
  );
  const selectedCount = selectedList.length;

  const missingEmailSelected = useMemo(
    () => selectedList.some((inv) => !formatEmail(inv)),
    [selectedList],
  );

  const canSend = selectedCount > 0 && !missingEmailSelected;

  const setRowMessage = useCallback((id, text) => {
    editedIdsRef.current.add(id);
    setCustomMessages((prev) => ({ ...prev, [id]: text }));
  }, []);

  const addGlobalFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    setGlobalFiles((prev) => [...prev, ...files.map((file) => ({ id: newLocalId(), name: file.name, file }))]);
  }, []);

  const removeGlobalFile = useCallback((id) => {
    setGlobalFiles((prev) => prev.filter((f) => f.id !== id));
    setRecipientOmitGlobal((prev) => {
      const next = { ...prev };
      for (const invId of Object.keys(next)) {
        const omit = next[invId];
        if (omit?.[id]) {
          const { [id]: _, ...rest } = omit;
          if (Object.keys(rest).length) next[invId] = rest;
          else delete next[invId];
        }
      }
      return next;
    });
  }, []);

  const addRowFiles = useCallback((invId, fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    setRowFiles((prev) => {
      const existing = prev[invId] ?? [];
      const next = [...existing, ...files.map((file) => ({ id: newLocalId(), name: file.name, file }))];
      return { ...prev, [invId]: next };
    });
  }, []);

  const removeRowFile = useCallback((invId, fileId) => {
    setRowFiles((prev) => {
      const list = prev[invId] ?? [];
      const filtered = list.filter((f) => f.id !== fileId);
      if (!filtered.length) {
        const { [invId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [invId]: filtered };
    });
  }, []);

  const omitGlobalForRecipient = useCallback((invId, globalFileId) => {
    setRecipientOmitGlobal((prev) => ({
      ...prev,
      [invId]: { ...(prev[invId] || {}), [globalFileId]: true },
    }));
  }, []);

  const getEffectiveAttachments = useCallback(
    (invId) => {
      const omitted = recipientOmitGlobal[invId] || {};
      const inherited = globalFiles.filter((g) => !omitted[g.id]).map((g) => ({ ...g, source: "global" }));
      const own = (rowFiles[invId] ?? []).map((f) => ({ ...f, source: "recipient" }));
      return [...inherited, ...own];
    },
    [globalFiles, recipientOmitGlobal, rowFiles],
  );

  const toggleRecipient = useCallback((invId, checked) => {
    setSelectedRecipients((prev) => ({ ...prev, [invId]: checked }));
  }, []);

  const handleSend = () => {
    if (!canSend || sendSuccess) return;
    const payload = selectedList.map((inv) => {
      const effective = getEffectiveAttachments(inv.id);
      return {
        invoiceId: inv.id,
        client: inv.client,
        email: formatEmail(inv),
        message: (customMessages[inv.id] ?? "").trim(),
        attachments: effective.map((f) => ({ name: f.name, origin: f.source })),
      };
    });
    if (import.meta.env.DEV) {
      console.info("[SendReminders] selected payload", payload);
    }
    const { dismissInsightIds, acknowledgeBulkOverdueBadge } = getReminderDismissPayload(insight);
    acknowledgeRemindersSent({
      recipientCount: selectedList.length,
      dismissInsightIds,
      acknowledgeBulkOverdueBadge,
    });
    setSendSuccess(true);
    window.setTimeout(() => {
      closeModal();
    }, 1400);
  };

  const sendButtonLabel =
    selectedCount === 0
      ? "Send Reminders"
      : selectedCount === 1
        ? "Send Reminder"
        : `Send ${selectedCount} Reminders`;

  return (
    <div className={`${sans} flex h-full min-h-0 flex-1 flex-col overflow-hidden text-sm text-[#303973]`}>
      <div className="shrink-0">
        <p className="mb-4 text-xs leading-relaxed text-[#828BB9]">
          Review the global template, then expand each client to personalize their email. Attachments are references only
          in this preview.
        </p>

        <div className="mb-4 rounded-xl border border-[#ECECEC] bg-white p-4 shadow-[0px_1px_8px_rgba(54,76,215,0.08)]">
          <label className={`mb-2 block text-xs font-medium text-[#B1B1C2] ${sans}`}>Global Reminder Message</label>
          <div
            ref={globalEditorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Global reminder message"
            onInput={() => {
              const editor = globalEditorRef.current;
              if (!editor) return;
              pendingCaretRef.current = getCaretOffset(editor);
              setGlobalTemplate(editor.innerText.replace(/\r/g, ""));
            }}
            className="min-h-[7.5rem] w-full overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#ECECEC] bg-white px-3 pb-1.5 pt-2 text-sm text-[#1C1C1C] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          <p className="mt-1.5 text-[11px] leading-snug text-[#71717A]">
            Tip: Use <span className="font-medium text-[#2F51A1]">@client</span>,{" "}
            <span className="font-medium text-[#2F51A1]">@invoice</span>,{" "}
            <span className="font-medium text-[#2F51A1]">@amount</span>, or{" "}
            <span className="font-medium text-[#2F51A1]">@duedate</span> to auto-fill details.
          </p>
          <div
            className="mt-2 flex flex-row flex-wrap items-center gap-3"
            role="list"
            aria-label="Global attachments"
          >
            <input
              ref={globalFileRef}
              type="file"
              className="sr-only"
              multiple
              accept=".pdf,.doc,.docx,application/pdf"
              onChange={(e) => {
                addGlobalFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => globalFileRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#ECECEC] bg-[#F8F9FF] px-3 py-2 text-xs font-medium text-[#303973] transition hover:bg-[#F5F7FF]"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Add attachments
            </button>
            {globalFiles.map((f) => (
              <span
                key={f.id}
                role="listitem"
                className="inline-flex max-w-[150px] items-center gap-1.5 rounded-full border border-[#ECECEC] bg-[#F8F9FF] py-1 pl-2.5 pr-1 text-xs font-medium text-[#303973]"
              >
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeGlobalFile(f.id)}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#5E6685] transition hover:bg-[#E8EBFF] hover:text-[#303973]"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-[#B1B1C2]">Recipients</p>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
          <ul className="space-y-2">
            {queue.length === 0 ? (
              <li className="rounded-xl border border-dashed border-[#ECECEC] bg-[#FAFAFA] px-4 py-6 text-center text-xs text-[#828BB9]">
                No invoices are linked to this insight.
              </li>
            ) : (
              queue.map((inv) => {
                const open = expandedId === inv.id;
                const email = formatEmail(inv);
                const missingEmail = !email;
                const checked = selectedRecipients[inv.id] === true;
                const rowList = rowFiles[inv.id] ?? [];
                const omitted = recipientOmitGlobal[inv.id] || {};
                const inheritedForRow = globalFiles.filter((g) => !omitted[g.id]);

                return (
                  <li
                    key={inv.id}
                    ref={(el) => {
                      rowCardRefs.current[inv.id] = el;
                    }}
                    className={[
                      "rounded-xl border transition-colors",
                      missingEmail ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#ECECEC] bg-white",
                      open && !missingEmail ? "bg-[#F8F9FF]" : !missingEmail ? "bg-white" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[#ECECEC] text-primary focus:ring-primary/30"
                        checked={checked}
                        onChange={(e) => toggleRecipient(inv.id, e.target.checked)}
                        aria-label={`Select ${inv.client}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#1C1C1C]">{inv.client}</p>
                        <p className="mt-0.5 text-xs text-[#B1B1C2]">{email || "No email on file"}</p>
                        <p className="mt-2 text-xs text-[#575E78]">
                          <span className="font-semibold text-[#303973]">{inv.id}</span>
                          <span className="mx-1.5 text-[#B1B1C2]">•</span>
                          <span>{formatInvoiceINR(Number(inv.amount) || 0)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedId((id) => (id === inv.id ? null : inv.id))}
                        className="shrink-0 rounded-lg border border-[#ECECEC] bg-white p-2 text-[#303973] shadow-sm transition hover:bg-[#F5F7FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                        aria-expanded={open}
                        aria-label={`Message for ${inv.client}`}
                      >
                        <MessageSquare className="h-4 w-4" strokeWidth={1.85} />
                      </button>
                    </div>

                    {open ? (
                      <div
                        className={[
                          "border-t px-3 pb-4 pt-2 sm:px-4",
                          missingEmail ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#ECECEC] bg-[#F5F7FF]/90",
                        ].join(" ")}
                      >
                        <input
                          ref={(el) => {
                            rowFileRefs.current[inv.id] = el;
                          }}
                          type="file"
                          className="sr-only"
                          multiple
                          accept=".pdf,application/pdf,.doc,.docx"
                          onChange={(e) => {
                            addRowFiles(inv.id, e.target.files);
                            e.target.value = "";
                          }}
                        />
                        <textarea
                          value={customMessages[inv.id] ?? ""}
                          onChange={(e) => setRowMessage(inv.id, e.target.value)}
                          rows={8}
                          aria-label={`Message for ${inv.client}`}
                          className="w-full resize-none rounded-xl border border-[#ECECEC] bg-white px-4 py-3 text-sm font-normal leading-relaxed text-[#1C1C1C] shadow-sm placeholder:text-[#B1B1C2] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                          placeholder="Message to send…"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2" aria-label={`Attachments for ${inv.client}`}>
                          {inheritedForRow.map((g) => (
                            <span
                              key={`g-${g.id}`}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#D4DCF5] bg-[#F4F7FF] py-1 pl-2.5 pr-1 text-[11px] font-medium text-[#303973]"
                            >
                              <span className="truncate">{g.name}</span>
                              <button
                                type="button"
                                onClick={() => omitGlobalForRecipient(inv.id, g.id)}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#5E6685] transition hover:bg-[#E2E9FF] hover:text-[#303973]"
                                aria-label={`Remove ${g.name} for this recipient only`}
                              >
                                <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                              </button>
                            </span>
                          ))}
                          {rowList.map((f) => (
                            <span
                              key={`r-${f.id}`}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ECECEC] bg-white py-1 pl-2.5 pr-1 text-[11px] font-medium text-[#303973]"
                            >
                              <span className="truncate">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => removeRowFile(inv.id, f.id)}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#5E6685] transition hover:bg-[#F5F7FF] hover:text-[#303973]"
                                aria-label={`Remove ${f.name}`}
                              >
                                <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => rowFileRefs.current[inv.id]?.click()}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[#C9CFE8] bg-white text-primary transition hover:bg-[#F4F7FF]"
                            aria-label={`Add file for ${inv.client}`}
                            title="Add attachment for this recipient"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-[#ECECEC] bg-white p-4">
        {sendSuccess ? (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} aria-hidden />
            Sent
          </span>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            disabled={sendSuccess}
            className="h-10 rounded-xl border border-[#ECECEC] bg-white px-4 text-sm font-medium text-[#303973] shadow-sm transition hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canSend || sendSuccess}
            title={
              selectedCount === 0
                ? "Select at least one recipient"
                : missingEmailSelected
                  ? "Add a valid email for every selected recipient"
                  : undefined
            }
            onClick={handleSend}
            className="h-10 rounded-xl bg-[#2F51A1] px-4 text-sm font-normal text-white transition hover:bg-[#254278] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {sendButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
