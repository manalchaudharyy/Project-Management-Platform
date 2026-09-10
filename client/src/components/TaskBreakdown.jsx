import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { StatusBadge, PriorityBadge } from "./Badge";

// Breaks a single task into smaller sub-tasks using AI.
// Selected sub-tasks get added as new tasks in the same project.
const TaskBreakdown = ({ taskId, projectId, onTasksAdded }) => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const breakdown = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.post(`/tasks/${taskId}/ai/breakdown`, {});
      const generated = res.data.tasks || [];
      setTasks(generated);
      setSelected(new Set(generated.map((_, i) => i)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not break down this task. Try again.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (index) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addSelected = async () => {
    const chosen = tasks.filter((_, i) => selected.has(i));
    if (chosen.length === 0) return;
    setAdding(true);
    setError("");
    try {
      await Promise.all(
        chosen.map((t) =>
          axiosClient.post("/tasks", {
            title: t.title,
            description: t.description,
            project: projectId,
            priority: t.priority,
            status: t.suggestedStatus,
            dueDate: t.suggestedDueDate,
          })
        )
      );
      setTasks([]);
      setSelected(new Set());
      setOpen(false);
      onTasksAdded?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add the selected sub-tasks.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-line bg-panel overflow-hidden">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && tasks.length === 0) breakdown();
        }}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-marker">✦</span>
          <span className="font-display font-semibold text-ink">Break Down Task with AI</span>
        </div>
        <span className="text-xs text-ink-muted">{open ? "Hide" : "Get sub-task suggestions"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-5">
          {error && <p className="mb-3 text-sm text-priority-critical">{error}</p>}

          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-md bg-line/40 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <div>
              <p className="text-xs font-mono text-ink-muted mb-2">
                {selected.size} of {tasks.length} selected
              </p>

              <div className="rounded-lg border border-line bg-paper divide-y divide-line">
                {tasks.map((t, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-panel/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-1 accent-blueprint"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink text-sm">{t.title}</p>
                        {t.priority && <PriorityBadge priority={t.priority} />}
                        {t.suggestedStatus && <StatusBadge status={t.suggestedStatus} />}
                      </div>
                      {t.description && (
                        <p className="text-xs text-ink-muted mt-1">{t.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={addSelected}
                  disabled={adding || selected.size === 0}
                  className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? "Adding…" : `Add Selected Sub-tasks (${selected.size})`}
                </button>
                <button
                  onClick={breakdown}
                  disabled={loading || adding}
                  className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper transition-colors disabled:opacity-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskBreakdown;