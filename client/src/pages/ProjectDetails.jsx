import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge, PriorityBadge } from "../components/Badge";

const ProjectDetails = () => {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        axiosClient.get(`/projects/${id}`),
        axiosClient.get(`/tasks?project=${id}`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data.data);
    } catch (err) {
      setError("Could not load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/tasks", {
        title,
        project: id,
        assignee: assignee || undefined,
      });
      setTitle("");
      setAssignee("");
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError("Could not create task");
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

  const members = project.members || [];

  return (
    <AppLayout title={project.name}>
      <div className="mb-6 rounded-lg border border-line bg-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {project.description && (
              <p className="text-sm text-ink-muted">{project.description}</p>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>
        <Link
          to={`/projects/${id}/kanban`}
          className="mt-4 inline-block text-sm font-medium text-blueprint hover:text-marker"
        >
          View Kanban board
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-priority-critical">{error}</p>}

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
          className="mb-5 rounded-lg border border-line bg-panel p-5 flex flex-wrap gap-3"
        >
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 min-w-40 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.username}
              </option>
            ))}
          </select>
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
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{task.title}</p>
                <p className="text-xs text-ink-muted font-mono mt-0.5">
                  {task.assignee ? task.assignee.username : "Unassigned"}
                </p>
              </div>
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