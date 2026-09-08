import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge } from "../components/Badge";

const STATUS_SEGMENTS = [
  { key: "done", label: "Done", color: "#059669" },
  { key: "in-progress", label: "In progress", color: "#b45309" },
  { key: "review", label: "Review", color: "#7c3aed" },
  { key: "todo", label: "To do", color: "#a8a29e" },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);

  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axiosClient.get("/projects");
        const list = res.data;
        setProjects(list);

        const statsEntries = await Promise.all(
          list.map(async (p) => {
            try {
              const statRes = await axiosClient.get(`/projects/${p._id}/dashboard`);
              return [p._id, statRes.data];
            } catch {
              return [p._id, null];
            }
          })
        );

        setProjectStats(Object.fromEntries(statsEntries));
      } catch (err) {
        setError("Could not load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Aggregate task totals across every project
  const totals = Object.values(projectStats).reduce(
    (acc, s) => {
      if (!s) return acc;
      acc.total += s.totalTasks || 0;
      acc.done += s.tasksByStatus?.done || 0;
      acc.inProgress += s.tasksByStatus?.["in-progress"] || 0;
      acc.review += s.tasksByStatus?.review || 0;
      acc.todo += s.tasksByStatus?.todo || 0;
      acc.overdue += s.overdueTasks || 0;
      return acc;
    },
    { total: 0, done: 0, inProgress: 0, review: 0, todo: 0, overdue: 0 }
  );

  const segmentCounts = {
    done: totals.done,
    "in-progress": totals.inProgress,
    review: totals.review,
    todo: totals.todo,
  };

  // Build a conic-gradient string from the segment counts
  let cumulative = 0;
  const gradientStops = STATUS_SEGMENTS.filter((s) => segmentCounts[s.key] > 0).map((s) => {
    const pct = totals.total ? (segmentCounts[s.key] / totals.total) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return `${s.color} ${start}% ${cumulative}%`;
  });
  const donutStyle =
    totals.total > 0
      ? { background: `conic-gradient(${gradientStops.join(", ")})` }
      : { background: "#e7e5e4" };

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    )
    .slice(0, 5);

  return (
    <AppLayout title="Dashboard">

      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          {greeting()}, {user?.username}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Here's an overview of your workspace.
        </p>
      </div>

      {/* Compact stat strip */}
      <div className="mb-8 grid grid-cols-2 divide-x divide-line rounded-xl border border-line bg-white shadow-card sm:grid-cols-4">
        <StatCell icon="▤" label="Boards" value={projects.length} />
        <StatCell icon="☰" label="Total tasks" value={totals.total} iconBg="bg-marker/10" iconColor="text-marker" />
        <StatCell icon="✓" label="Completed" value={totals.done} accent="text-emerald-600" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCell
          icon="!"
          label="Overdue"
          value={totals.overdue}
          accent={totals.overdue ? "text-priority-critical" : "text-ink"}
          iconBg={totals.overdue ? "bg-red-50" : "bg-paper"}
          iconColor={totals.overdue ? "text-priority-critical" : "text-ink-muted"}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Task overview donut */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-card">
            <p className="mb-4 text-sm font-semibold text-ink">Task overview</p>

            <div className="flex flex-wrap items-center gap-6">
              <div
                className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full shadow-inner"
                style={donutStyle}
              >
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-card">
                  <span className="text-xl font-semibold text-ink">{totals.total}</span>
                  <span className="text-[11px] text-ink-muted">tasks</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {STATUS_SEGMENTS.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-ink-muted">{s.label}</span>
                    <span className="font-medium text-ink">{segmentCounts[s.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project progress */}
          <div className="rounded-xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-sm font-semibold text-ink">Project progress</p>
              <Link to="/projects" className="text-sm font-medium text-marker hover:underline">
                View all →
              </Link>
            </div>

            {loading && (
              <div className="space-y-3 p-5">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-paper" />
                ))}
              </div>
            )}

            {!loading && projects.length === 0 && (
              <p className="px-5 py-6 text-sm text-ink-muted">
                No boards yet — create one to see progress here.
              </p>
            )}

            {!loading && projects.length > 0 && (
              <div className="divide-y divide-line">
                {projects.map((p) => {
                  const pct = projectStats[p._id]?.completionPercentage ?? 0;
                  return (
                    <Link
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className="block px-5 py-3.5 transition hover:bg-paper"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-ink">{p.name}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                          <div
                            className="h-full rounded-full bg-marker"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-9 shrink-0 text-right text-xs text-ink-muted">{pct}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">

          {/* Recent activity */}
          <div className="rounded-xl border border-line bg-white shadow-card">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Recent activity</p>
            </div>

            {recentProjects.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-muted">Nothing to show yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {recentProjects.map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition hover:bg-paper"
                  >
                    <span className="truncate text-ink">{project.name}</span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {timeAgo(project.updatedAt || project.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-line bg-white shadow-card">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Quick actions</p>
            </div>

            <div className="flex flex-col divide-y divide-line">
              <Link to="/projects" className="px-4 py-2.5 text-sm text-ink transition hover:bg-paper">
                + Create a board
              </Link>
              <Link to="/profile" className="px-4 py-2.5 text-sm text-ink transition hover:bg-paper">
                View your profile
              </Link>
              {["admin", "pm"].includes(user?.role) && (
                <Link to="/admin/users" className="px-4 py-2.5 text-sm text-ink transition hover:bg-paper">
                  Manage workspace users
                </Link>
              )}
            </div>
          </div>

        </div>

      </div>

    </AppLayout>
  );
};

const StatCell = ({
  icon,
  label,
  value,
  accent = "text-ink",
  iconBg = "bg-paper",
  iconColor = "text-ink",
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm ${iconBg} ${iconColor}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-xl font-semibold leading-tight tracking-tight ${accent}`}>{value}</p>
      <p className="truncate text-xs text-ink-muted">{label}</p>
    </div>
  </div>
);

export default Dashboard;