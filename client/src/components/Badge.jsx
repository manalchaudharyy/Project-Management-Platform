const STATUS_STYLES = {
  planning: "bg-status-todo/10 text-status-todo ring-status-todo/20",
  "on-hold": "bg-priority-high/10 text-priority-high ring-priority-high/20",
  active: "bg-status-progress/10 text-status-progress ring-status-progress/20",
  todo: "bg-status-todo/10 text-status-todo ring-status-todo/20",
  "in-progress": "bg-status-progress/10 text-status-progress ring-status-progress/20",
  review: "bg-status-review/10 text-status-review ring-status-review/20",
  done: "bg-status-done/10 text-status-done ring-status-done/20",
  completed: "bg-status-done/10 text-status-done ring-status-done/20",
  archived: "bg-ink-muted/10 text-ink-muted ring-ink-muted/20",
};

const PRIORITY_STYLES = {
  low: "bg-priority-low/10 text-priority-low ring-priority-low/20",
  medium: "bg-priority-medium/10 text-priority-medium ring-priority-medium/20",
  high: "bg-priority-high/10 text-priority-high ring-priority-high/20",
  critical: "bg-priority-critical/10 text-priority-critical ring-priority-critical/20",
};

const LABELS = {
  "in-progress": "In progress",
  "on-hold": "On hold",
};

const label = (value) => LABELS[value] || (value ? value[0].toUpperCase() + value.slice(1) : "—");

const baseClasses =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset";

const Dot = () => <span className="h-1.5 w-1.5 rounded-full bg-current" />;

export const StatusBadge = ({ status }) => (
  <span className={`${baseClasses} ${STATUS_STYLES[status] || "bg-ink-muted/10 text-ink-muted ring-ink-muted/20"}`}>
    <Dot />
    {label(status)}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`${baseClasses} ${PRIORITY_STYLES[priority] || "bg-ink-muted/10 text-ink-muted ring-ink-muted/20"}`}>
    <Dot />
    {label(priority)}
  </span>
);