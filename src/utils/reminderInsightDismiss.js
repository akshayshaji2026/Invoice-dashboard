/**
 * Maps a reminder modal `insight` payload to canonical AI insight ids to dismiss
 * and whether the dashboard overdue badge should clear (bulk overdue flow only).
 */
export function getReminderDismissPayload(insight) {
  if (!insight) {
    return { dismissInsightIds: [], acknowledgeBulkOverdueBadge: false };
  }

  const isOverdueFlow =
    insight.bodyKind === "overdue_summary" ||
    insight.id === "bulk-overdue-reminders" ||
    insight.id === "ai-overdue-summary";

  if (isOverdueFlow) {
    return {
      dismissInsightIds: ["ai-overdue-summary"],
      acknowledgeBulkOverdueBadge: true,
    };
  }

  if (insight.id === "ai-follow-up") {
    return {
      dismissInsightIds: ["ai-follow-up"],
      acknowledgeBulkOverdueBadge: false,
    };
  }

  return { dismissInsightIds: [], acknowledgeBulkOverdueBadge: false };
}
