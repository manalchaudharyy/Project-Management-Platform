import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge } from "../components/Badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
  AreaChart, Area, ResponsiveContainer,
} from "recharts";

const STATUS_SEGMENTS = [
  { key: "done", label: "Done", color: "#059669" },
  { key: "in-progress", label: "In progress", color: "#b45309" },
  { key: "review", label: "Review", color: "#7c3aed" },
  { key: "todo", label: "To do", color: "#a8a29e" },
];

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
      } catch {
        setError("Could not load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Aggregate totals across every project (same as before)
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

  // Bar chart data: tasks by status
  const byStatusData = STATUS_SEGMENTS.map((s) => ({
    name: s.label,
    count:
      s.key === "done" ? totals.done :
      s.key === "in-progress" ? totals.inProgress :
      s.key === "review" ? totals.review : totals.todo,
    color: s.color,
  }));

 const donutData = [
  { name: "Complete", value: totals.done, color: "#7c5cff" },
  { name: "Incomplete", value: totals.total - totals.done, color: "#e7e5e4" },
];

  // Bar chart data: tasks by assignee, merged across projects
  const assigneeMap = {};
  Object.values(projectStats).forEach((s) => {
    (s?.tasksByAssignee || []).forEach((a) => {
      assigneeMap[a.name] = (assigneeMap[a.name] || 0) + a.count;
    });
  });
  const byAssigneeData = Object.entries(assigneeMap).map(([name, count]) => ({ name, count }));

  // Area chart data: completion trend, merged day-by-day across projects
  const trendMap = {};
  Object.values(projectStats).forEach((s) => {
    (s?.completionTrend || []).forEach((t) => {
      if (!trendMap[t.date]) trendMap[t.date] = { date: t.date, complete: 0, incomplete: 0 };
      trendMap[t.date].complete += t.complete;
      trendMap[t.date].incomplete += t.incomplete;
    });
  });
  const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Overview
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Top stat row — matches the 4 numbers in the Asana screenshot */}
     <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
  <StatCard index={0} value={totals.done} label="Completed tasks" />
  <StatCard index={1} value={totals.total - totals.done} label="Incomplete tasks" />
  <StatCard index={2} value={totals.overdue} label="Overdue tasks" accent={totals.overdue ? "text-priority-critical" : "text-ink"} />
  <StatCard index={3} value={totals.total} label="Total tasks" />
</div>

      {/* 3-chart row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Tasks by status">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completion status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
             <Pie data={donutData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
</Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs text-ink-muted">
            {donutData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Tasks by assignee">
          {byAssigneeData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No assigned tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byAssigneeData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c5cff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Trend chart, full width */}
      <div className="mb-8">
        <ChartCard title="Task completion over time (last 14 days)">
          {trendData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">Not enough recent activity yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="incomplete" stackId="1" stroke="#a8a29e" fill="#e7e5e4" name="Incomplete" />
                <Area type="monotone" dataKey="complete" stackId="1" stroke="#7c5cff" fill="#c4b5fd" name="Complete" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Existing project list + quick actions, kept as-is below the charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-sm font-semibold text-ink">Project progress</p>
              <Link to="/projects" className="text-sm font-medium text-marker hover:underline">View all →</Link>
            </div>
            {loading && (
              <div className="space-y-3 p-5">
                {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-paper" />)}
              </div>
            )}
            {!loading && projects.length === 0 && (
              <p className="px-5 py-6 text-sm text-ink-muted">No boards yet — create one to see progress here.</p>
            )}
            {!loading && projects.length > 0 && (
              <div className="divide-y divide-line">
                {projects.map((p) => {
                  const pct = projectStats[p._id]?.completionPercentage ?? 0;
                  return (
                    <Link key={p._id} to={`/projects/${p._id}`} className="block px-5 py-3.5 transition hover:bg-paper">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-ink">{p.name}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                          <div className="h-full rounded-full bg-marker" style={{ width: `${pct}%` }} />
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

        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-white shadow-card">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Quick actions</p>
            </div>
            <div className="flex flex-col divide-y divide-line">
              <Link to="/projects" className="px-4 py-2.5 text-sm text-ink transition hover:bg-paper">+ Create a board</Link>
              <Link to="/profile" className="px-4 py-2.5 text-sm text-ink transition hover:bg-paper">View your profile</Link>
              {["admin", "pm"].includes(user?.role) && (
                <Link to="/admin/users" className="px-4 py-2.5 text-sm text-ink transition hover:bg-paper">Manage workspace users</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const STAT_STYLES = [
  { icon: "✓", bg: "bg-emerald-100", color: "text-emerald-600" },
  { icon: "◷", bg: "bg-amber-100", color: "text-amber-600" },
  { icon: "!", bg: "bg-rose-100", color: "text-rose-600" },
  { icon: "▤", bg: "bg-violet-100", color: "text-violet-600" },
];

const StatCard = ({ value, label, index = 0, accent = "text-ink" }) => {
  const style = STAT_STYLES[index] || STAT_STYLES[0];
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${style.bg} ${style.color} text-sm font-bold`}>
        {style.icon}
      </div>
      <p className={`font-display text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="rounded-xl border border-line bg-white p-4 shadow-card">
    <p className="mb-3 text-sm font-semibold text-ink">{title}</p>
    {children}
  </div>
);

export default Dashboard;