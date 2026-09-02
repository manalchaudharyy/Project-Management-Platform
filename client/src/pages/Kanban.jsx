import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { PriorityBadge } from "../components/Badge";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const Kanban = () => {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axiosClient.get(`/tasks?project=${projectId}&limit=100`);
        setTasks(res.data.data);
      } catch (err) {
        setError("Could not load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  const handleDrop = async (newStatus) => {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t._id === draggedTaskId);
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic update — change it on screen immediately
    setTasks((prev) =>
      prev.map((t) => (t._id === draggedTaskId ? { ...t, status: newStatus } : t))
    );
    setDraggedTaskId(null);

    try {
      await axiosClient.put(`/tasks/${task._id}`, { status: newStatus });
    } catch (err) {
      // Revert if the server rejects it
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: task.status } : t))
      );
      setError("Could not update task status");
    }
  };

  if (loading) return <AppLayout title="Kanban Board"><p className="text-sm text-ink-muted">Loading…</p></AppLayout>;

  return (
    <AppLayout title="Kanban Board">
      {error && <p className="mb-4 text-sm text-priority-critical">{error}</p>}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
              className="flex-1 min-w-65 bg-panel border border-line rounded-lg"
            >
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-ink">{col.label}</h3>
                <span className="text-xs font-mono text-ink-muted">{columnTasks.length}</span>
              </div>

              <div className="p-3 space-y-2 min-h-50">
                {columnTasks.map((task) => (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    draggable
                    onDragStart={() => setDraggedTaskId(task._id)}
                    className="block bg-paper border border-line rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-blueprint transition-colors"
                  >
                    <p className="text-sm text-ink font-medium mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <PriorityBadge priority={task.priority} />
                      {task.dueDate && (
                        <span className="text-xs text-ink-muted font-mono">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}

                {columnTasks.length === 0 && (
                  <p className="text-xs text-ink-muted text-center py-6">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Kanban;