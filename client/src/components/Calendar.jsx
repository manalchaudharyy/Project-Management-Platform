import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRIORITY_DOT = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  critical: "bg-priority-critical",
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Builds a 6-week (42-day) grid starting from the Sunday on/before the 1st
// of the month, so the calendar always renders full weeks.
const buildMonthGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
};

/**
 * Month-grid calendar of task due dates.
 *
 * Props:
 *  - tasks: array of { _id, title, dueDate, priority, projectName? }
 *  - onTaskClick: optional (task) => void, called when a chip is clicked.
 *      If omitted, chips link straight to /tasks/:id.
 */
const Calendar = ({ tasks = [], onTaskClick }) => {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = new Date();

  const days = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Group tasks by day-of-month string key so each grid cell can look its
  // tasks up in O(1) instead of filtering the whole list 42 times.
  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const d = new Date(task.dueDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };
  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-muted transition hover:bg-paper"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:bg-paper"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-muted transition hover:bg-paper"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date, i) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const dayTasks = tasksByDay[key] || [];
          const isCurrentMonth = date.getMonth() === month;
          const isToday = sameDay(date, today);

          return (
            <div
              key={i}
              className={`min-h-[92px] border-b border-r border-line p-1.5 last:border-r-0 ${
                isCurrentMonth ? "bg-white" : "bg-paper/60"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-blueprint font-semibold text-white"
                    : isCurrentMonth
                    ? "text-ink"
                    : "text-ink-muted/50"
                }`}
              >
                {date.getDate()}
              </span>

              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const chip = (
                    <span
                      className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] text-ink transition hover:bg-paper"
                      title={task.projectName ? `${task.title} — ${task.projectName}` : task.title}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          PRIORITY_DOT[task.priority] || "bg-ink-muted"
                        }`}
                      />
                      <span className="truncate">{task.title}</span>
                    </span>
                  );

                  return onTaskClick ? (
                    <button
                      key={task._id}
                      type="button"
                      onClick={() => onTaskClick(task)}
                      className="block w-full text-left"
                    >
                      {chip}
                    </button>
                  ) : (
                    <Link key={task._id} to={`/tasks/${task._id}`} className="block">
                      {chip}
                    </Link>
                  );
                })}
                {dayTasks.length > 3 && (
                  <p className="px-1 text-[10px] text-ink-muted">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;