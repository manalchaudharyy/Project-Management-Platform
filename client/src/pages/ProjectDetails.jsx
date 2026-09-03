import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge, PriorityBadge } from "../components/Badge";

const STATUS_LABELS = { todo: "To Do", "in-progress": "In Progress", review: "Review", done: "Done" };
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const STATUS_BAR_COLORS = {
  todo: "bg-status-todo",
  "in-progress": "bg-status-progress",
  review: "bg-status-review",
  done: "bg-status-done",
};
const PRIORITY_BAR_COLORS = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  critical: "bg-priority-critical",
};

// Small horizontal bar used for both the status and priority breakdowns.
const StatBar = ({ label, count, total, colorClass }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink-muted">{label}</span>
        <span className="font-mono text-ink-muted">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-line overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const canManage =
    !!project &&
    (project.owner?._id === currentUser?.id || ["admin", "pm"].includes(currentUser?.role));

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, statsRes] = await Promise.all([
        axiosClient.get(`/projects/${id}`),
        axiosClient.get(`/tasks?project=${id}`),
        axiosClient.get(`/projects/${id}/dashboard`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data.data);
      setStats(statsRes.data);
    } catch (err) {
      setError("Could not load project");
    } finally {
      setLoading(false);
    }
  };

  // Only admin/pm can list all users (matches the backend's /users guard),
  // so this quietly no-ops for a plain member instead of showing an error.
  const fetchUsers = async () => {
    if (!["admin", "pm"].includes(currentUser?.role)) return;
    try {
      const res = await axiosClient.get("/users");
      setAllUsers(res.data);
    } catch (err) {
      // not fatal — the "add member" dropdown just stays empty
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/tasks", { title, project: id });
      setTitle("");
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError("Could not create task");
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Archive this project? It'll be marked archived but not deleted.")) return;
    try {
      const res = await axiosClient.put(`/projects/${id}`, { status: "archived" });
      setProject((prev) => ({ ...prev, status: res.data.status }));
    } catch (err) {
      setError("Could not archive project");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this project permanently? This cannot be undone.")) return;
    try {
      await axiosClient.delete(`/projects/${id}`);
      navigate("/projects");
    } catch (err) {
      setError("Could not delete project");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      const res = await axiosClient.post(`/projects/${id}/members`, { userId: selectedUserId });
      setProject((prev) => ({ ...prev, members: res.data.members }));
      setSelectedUserId("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the project?")) return;
    try {
      const res = await axiosClient.delete(`/projects/${id}/members`, { data: { userId } });
      setProject((prev) => ({ ...prev, members: res.data.members }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove member");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading…">
        <p className="text-sm text-ink-muted">Loading project…</p>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project not found">
        <p className="text-sm text-priority-critical">{error || "Project not found"}</p>
      </AppLayout>
    );
  }

  const memberIds = new Set((project.members || []).map((m) => m._id));
  const addableUsers = allUsers.filter((u) => !memberIds.has(u._id) && u._id !== project.owner?._id);

  return (
    <AppLayout title={project.name}>
      <div className="mb-6 rounded-lg border border-line bg-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {project.description && (
              <p className="text-sm text-ink-muted">{project.description}</p>
            )}
            {project.owner && (
              <p className="mt-1 text-xs text-ink-muted font-mono">Owner: {project.owner.username}</p>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            to={`/projects/${id}/kanban`}
            className="text-sm font-medium text-blueprint hover:text-marker"
          >
            View Kanban board
          </Link>

          {canManage && project.status !== "archived" && (
            <button
              onClick={handleArchive}
              className="text-sm font-medium text-ink-muted hover:text-marker"
            >
              Archive project
            </button>
          )}

          {canManage && (
            <button
              onClick={handleDelete}
              className="text-sm font-medium text-priority-critical hover:opacity-80"
            >
              Delete project
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-priority-critical">{error}</p>}

      {/* Dashboard stats */}
      {stats && (
        <div className="mb-6 rounded-lg border border-line bg-panel p-5">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Dashboard</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              ["Total tasks", stats.totalTasks],
              ["Completed", stats.completedTasks],
              ["Pending", stats.pendingTasks],
              ["Overdue", stats.overdueTasks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-line bg-paper px-4 py-3">
                <p className="text-xs text-ink-muted">{label}</p>
                <p className="font-display text-2xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-ink-muted">Completion</span>
              <span className="font-mono text-ink-muted">{stats.completionPercentage}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-status-done"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-mono text-ink-muted uppercase">By status</p>
              {Object.keys(STATUS_LABELS).map((key) => (
                <StatBar
                  key={key}
                  label={STATUS_LABELS[key]}
                  count={stats.tasksByStatus?.[key] || 0}
                  total={stats.totalTasks}
                  colorClass={STATUS_BAR_COLORS[key]}
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-mono text-ink-muted uppercase">By priority</p>
              {Object.keys(PRIORITY_LABELS).map((key) => (
                <StatBar
                  key={key}
                  label={PRIORITY_LABELS[key]}
                  count={stats.tasksByPriority?.[key] || 0}
                  total={stats.totalTasks}
                  colorClass={PRIORITY_BAR_COLORS[key]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mb-6 rounded-lg border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">Team members</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {(project.members || []).map((member) => (
            <span
              key={member._id}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink"
            >
              {member.username}
              {member._id === project.owner?._id && (
                <span className="text-xs text-ink-muted font-mono">owner</span>
              )}
              {canManage && member._id !== project.owner?._id && (
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  className="text-ink-muted hover:text-priority-critical leading-none"
                  aria-label={`Remove ${member.username}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {(project.members || []).length === 0 && (
            <p className="text-sm text-ink-muted">No members yet.</p>
          )}
        </div>

        {canManage && addableUsers.length > 0 && (
          <form onSubmit={handleAddMember} className="flex gap-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            >
              <option value="">Select a user to add…</option>
              {addableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username} ({u.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedUserId}
              className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </form>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">Tasks</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors"
        >
          {showForm ? "Cancel" : "New task"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="mb-5 rounded-lg border border-line bg-panel p-5 flex gap-3"
        >
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
          />
          <button
            type="submit"
            className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors"
          >
            Add
          </button>
        </form>
      )}

      {tasks.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">No tasks yet.</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="rounded-lg border border-line bg-panel divide-y divide-line">
          {tasks.map((task) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-paper transition-colors"
            >
              <p className="font-medium text-ink truncate">{task.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default ProjectDetails;