import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import {
  StatusBadge,
  PriorityBadge,
} from "../components/Badge";
import AIAssistant from "../components/AIAssistant";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      setError("");

      const [projectRes, tasksRes] =
        await Promise.all([
          axiosClient.get(`/projects/${id}`),
          axiosClient.get(
            `/tasks?project=${id}&limit=100`
          ),
        ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load project"
      );
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
      setError("");

      await axiosClient.post("/tasks", {
        title: title.trim(),
        project: id,
        assignee: assignee || undefined,
      });

      setTitle("");
      setAssignee("");
      setShowForm(false);

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create task"
      );
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axiosClient.delete(
        `/tasks/${task._id}`
      );

      setTasks((current) =>
        current.filter(
          (item) => item._id !== task._id
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete task"
      );
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <p className="text-sm text-ink-muted">
          Loading project...
        </p>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project not found">
        <p className="text-sm text-priority-critical">
          {error || "Project not found"}
        </p>
      </AppLayout>
    );
  }

  const members = project.members || [];

  return (
    <AppLayout title={project.name}>
      {/* PROJECT HEADER */}
      <div className="mb-6 rounded-lg border border-line bg-panel p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {project.description && (
              <p className="text-sm leading-6 text-ink-muted">
                {project.description}
              </p>
            )}
          </div>

          <StatusBadge status={project.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            to={`/projects/${id}/kanban`}
            className="text-sm font-medium text-blueprint transition hover:text-blueprint-dark"
          >
            View Kanban board →
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <AIAssistant
        projectId={id}
        onTasksAdded={fetchData}
      />

      {/* TASK HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          Tasks
        </h2>

        <button
          onClick={() =>
            setShowForm((value) => !value)
          }
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white transition hover:bg-blueprint-dark"
        >
          {showForm ? "Cancel" : "New task"}
        </button>
      </div>

      {/* CREATE TASK */}
      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="mb-5 flex flex-wrap gap-3 rounded-lg border border-line bg-panel p-5 shadow-card"
        >
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
            className="min-w-48 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          />

          <select
            value={assignee}
            onChange={(e) =>
              setAssignee(e.target.value)
            }
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          >
            <option value="">Unassigned</option>

            {members.map((member) => (
              <option
                key={member._id}
                value={member._id}
              >
                {member.username}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark"
          >
            Add Task
          </button>
        </form>
      )}

      {/* EMPTY */}
      {tasks.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">
            No tasks yet.
          </p>
        </div>
      )}

      {/* TASK LIST */}
      {tasks.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0 hover:bg-paper"
            >
              <Link
                to={`/tasks/${task._id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate font-medium text-ink">
                  {task.title}
                </p>

                <p className="mt-0.5 font-mono text-xs text-ink-muted">
                  {task.assignee
                    ? task.assignee.username
                    : "Unassigned"}
                </p>
              </Link>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <PriorityBadge
                  priority={task.priority}
                />

                <StatusBadge
                  status={task.status}
                />

                <Link
                  to={`/tasks/${task._id}`}
                  className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink transition hover:border-blueprint hover:text-blueprint"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteTask(task)
                  }
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default ProjectDetails;