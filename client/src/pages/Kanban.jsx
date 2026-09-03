import { useState, useEffect, useMemo } from "react";
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

const initials = (name = "?") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AssigneeAvatar = ({ name }) => (
  <span
    title={name}
    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blueprint/15 text-[10px] font-mono font-semibold text-blueprint"
  >
    {initials(name)}
  </span>
);

const Kanban = () => {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const [tasksRes, projectRes] = await Promise.all([
          axiosClient.get(`/tasks?project=${projectId}&limit=100`),
          axiosClient.get(`/projects/${projectId}`),
        ]);
        setTasks(tasksRes.data.data);
        setMembers(projectRes.data.members || []);
      } catch (err) {
        setError("Could not load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [projectId]);

  const workload = useMemo(() => {
    const counts = new Map(members.map((m) => [m._id, { member: m, count: 0 }]));
    let unassigned = 0;

    tasks.forEach((task) => {
      if (task.status === "done") return;
      if (!task.assignee) {
        unassigned += 1;
        return;
      }
      const entry = counts.get(task.assignee._id);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(task.assignee._id, { member: task.assignee, count: 1 });
      }
    });

    return { perMember: Array.from(counts.values()), unassigned };
  }, [tasks, members]);

  const handleDrop = async (newStatus) => {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t._id === draggedTaskId);
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t._id === draggedTaskId ? { ...t, status: newStatus } : t))
    );
    setDraggedTaskId(null);

    try {
      await axiosClient.put(`/tasks/${task._id}`, { status: newStatus });
    } catch (err) {
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

      {(workload.perMember.length > 0 || workload.unassigned > 0) && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-ink-muted mr-1">Workload:</span>
          {workload.perMember.map(({ member, count }) => (
            <span
              key={member._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-xs text-ink"
            >
              <AssigneeAvatar name={member.username} />
              {member.username}
              <span className="font-mono text-ink-muted">{count}</span>
            </span>
          ))}
          {workload.unassigned > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-ink-muted">
              Unassigned
              <span className="font-mono">{workload.unassigned}</span>
            </span>
          )}
        </div>
      )}

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
                    <div className="flex items-center justify-between gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.dueDate && (
                        <span className="text-xs text-ink-muted font-mono">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <AssigneeAvatar name={task.assignee ? task.assignee.username : "Unassigned"} />
                      <span className="text-xs text-ink-muted truncate">
                        {task.assignee ? task.assignee.username : "Unassigned"}
                      </span>
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