import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { StatusBadge, PriorityBadge } from "./Badge";

// AI Project Assistant
// Lets a user describe a high-level requirement, review the AI-generated
// tasks, pick which ones they actually want, and add only those to the
// project. Nothing is written to the database until the user confirms.
const AIAssistant = ({ projectId, onTasksAdded }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.post(`/projects/${projectId}/ai/generate-tasks`, {
        prompt,
      });
      const generated = res.data.tasks || [];
      setTasks(generated);
      // default: everything comes in checked, user can uncheck what they don't want
      setSelected(new Set(generated.map((_, i) => i)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate tasks. Try again.");
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

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === tasks.length ? new Set() : new Set(tasks.map((_, i) => i))
    );
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
      setPrompt("");
      setOpen(false);
      onTasksAdded?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add the selected tasks.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-line bg-panel overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-marker">✦</span>
          <span className="font-display font-semibold text-ink">AI Project Assistant</span>
        </div>
        <span className="text-xs text-ink-muted">{open ? "Hide" : "What would you like help with?"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-5">
          <p className="text-sm text-ink-muted mb-3">
            Describe what you're building and the assistant will draft a set of tasks for you to
            review before anything is saved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder='e.g. "Build an e-commerce checkout system with Stripe"'
              className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            />
            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Generating…" : "Generate Tasks"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-priority-critical">{error}</p>}

          {loading && (
            <div className="mt-5 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-md bg-line/40 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono text-ink-muted">
                  {selected.size} of {tasks.length} selected
                </p>
                <button
                  onClick={toggleAll}
                  className="text-xs font-medium text-blueprint hover:text-marker"
                >
                  {selected.size === tasks.length ? "Deselect all" : "Select all"}
                </button>
              </div>

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
                      <p className="text-xs font-mono text-ink-muted mt-1">
                        {t.estimatedEffort && <span>{t.estimatedEffort}</span>}
                        {t.estimatedEffort && t.suggestedDueDate && <span> · </span>}
                        {t.suggestedDueDate && <span>due {t.suggestedDueDate}</span>}
                      </p>
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
                  {adding ? "Adding…" : `Add Selected Tasks (${selected.size})`}
                </button>
                <button
                  onClick={generate}
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

export default AIAssistant;