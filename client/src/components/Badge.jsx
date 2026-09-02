const STATUS_STYLES = {
  planning: "bg-status-todo/10 text-status-todo",
  "on-hold": "bg-priority-medium/10 text-priority-medium",
  active: "bg-status-progress/10 text-status-progress",
  todo: "bg-status-todo/10 text-status-todo",
  "in-progress": "bg-status-progress/10 text-status-progress",
  review: "bg-status-review/10 text-status-review",
  done: "bg-status-done/10 text-status-done",
  completed: "bg-status-done/10 text-status-done",
  archived: "bg-ink-muted/10 text-ink-muted",
};

const PRIORITY_STYLES = {
  low: "bg-priority-low/10 text-priority-low",
  medium: "bg-priority-medium/10 text-priority-medium",
  high: "bg-priority-high/10 text-priority-high",
  critical: "bg-priority-critical/10 text-priority-critical",
};

const baseClasses =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono whitespace-nowrap";

export const StatusBadge = ({ status }) => (
  <span className={`${baseClasses} ${STATUS_STYLES[status] || "bg-ink-muted/10 text-ink-muted"}`}>
    {status}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`${baseClasses} ${PRIORITY_STYLES[priority] || "bg-ink-muted/10 text-ink-muted"}`}>
    {priority}
  </span>
);