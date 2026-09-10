import { useState } from "react";
import axiosClient from "../api/axiosClient";

// AI Risk Detection (bonus feature)
// Analyzes overdue tasks, high-priority tasks, deadlines, and assignee
// load, then shows AI-flagged risks with suggested actions.
const AIRiskDetection = ({ projectId }) => {
  const [risks, setRisks] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get(`/projects/${projectId}/ai/risks`);
      setRisks(res.data.risks || []);
      setSuggestedActions(res.data.suggestedActions || []);
      setChecked(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not analyze risks. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-line bg-panel px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-marker">⚠</span>
          <span className="font-display font-semibold text-ink">AI Risk Detection</span>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Analyzing…" : checked ? "Re-check" : "Check Risks"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-priority-critical">{error}</p>}

      {loading && (
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-line/40 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-line/40 animate-pulse" />
        </div>
      )}

      {!loading && checked && risks.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">No notable risks detected right now.</p>
      )}

      {!loading && risks.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-mono uppercase tracking-wide text-ink-muted mb-2">
            Potential Risks
          </p>
          <ul className="space-y-1.5 mb-4">
            {risks.map((r, i) => (
              <li key={i} className="text-sm text-ink flex gap-2">
                <span className="text-priority-critical">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {suggestedActions.length > 0 && (
            <>
              <p className="text-xs font-mono uppercase tracking-wide text-ink-muted mb-2">
                Suggested Actions
              </p>
              <ul className="space-y-1.5">
                {suggestedActions.map((a, i) => (
                  <li key={i} className="text-sm text-ink flex gap-2">
                    <span className="text-blueprint">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRiskDetection;