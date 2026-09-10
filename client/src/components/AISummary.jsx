import { useState } from "react";
import axiosClient from "../api/axiosClient";

// AI Project Summary
// One button that asks the backend for a short AI-written status paragraph
// based on the project's current task stats.
const AISummary = ({ projectId }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get(`/projects/${projectId}/ai/summary`);
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate summary. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-line bg-panel px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-marker">✦</span>
          <span className="font-display font-semibold text-ink">AI Summary</span>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Summarizing…" : summary ? "Regenerate" : "Generate Summary"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-priority-critical">{error}</p>}

      {loading && (
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-line/40 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-line/40 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-line/40 animate-pulse" />
        </div>
      )}

      {!loading && summary && (
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">{summary}</p>
      )}
    </div>
  );
};

export default AISummary;