import {
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  useParams,
  Link,
} from "react-router-dom";

import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { PriorityBadge } from "../components/Badge";

const COLUMNS = [
  {
    key: "todo",
    label: "To Do",
  },
  {
    key: "in-progress",
    label: "In Progress",
  },
  {
    key: "review",
    label: "Review",
  },
  {
    key: "done",
    label: "Done",
  },
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
    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-marker/10 text-[10px] font-semibold text-marker"
  >
    {initials(name)}
  </span>
);

const columnStyles = {
  todo: {
    dot: "bg-status-todo",
  },

  "in-progress": {
    dot: "bg-status-progress",
  },

  review: {
    dot: "bg-status-review",
  },

  done: {
    dot: "bg-status-done",
  },
};

const Kanban = () => {
  const { id: projectId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  const [project, setProject] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draggedTaskId, setDraggedTaskId] =
    useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setError("");

        const [
          tasksRes,
          projectRes,
        ] = await Promise.all([
          axiosClient.get(
            `/tasks?project=${projectId}&limit=100`
          ),

          axiosClient.get(
            `/projects/${projectId}`
          ),
        ]);

        setTasks(tasksRes.data.data || []);

        const projectData = projectRes.data;

        setProject(projectData);

        /*
          IMPORTANT:

          The project owner is also included in the
          member list so nobody disappears from Kanban.
        */

        const projectMembers =
          projectData.members || [];

        const owner = projectData.owner;

        const memberMap = new Map();

        projectMembers.forEach((member) => {
          memberMap.set(
            member._id.toString(),
            member
          );
        });

        if (owner) {
          memberMap.set(
            owner._id.toString(),
            owner
          );
        }

        setMembers(
          Array.from(memberMap.values())
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Could not load Kanban board"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [projectId]);

  /*
    Build workload from ALL members.

    Every member starts with count = 0.
    Therefore members with no tasks are still shown.
  */

  const workload = useMemo(() => {
    const counts = new Map();

    members.forEach((member) => {
      counts.set(member._id.toString(), {
        member,
        count: 0,
      });
    });

    let unassigned = 0;

    tasks.forEach((task) => {
      if (task.status === "done") {
        return;
      }

      if (!task.assignee) {
        unassigned += 1;
        return;
      }

      const assigneeId =
        task.assignee._id.toString();

      if (counts.has(assigneeId)) {
        counts.get(assigneeId).count += 1;
      } else {
        /*
          If a task has an assignee that is not
          currently present in the project members
          array, still show that person.
        */

        counts.set(assigneeId, {
          member: task.assignee,
          count: 1,
        });
      }
    });

    return {
      perMember: Array.from(
        counts.values()
      ),
      unassigned,
    };
  }, [tasks, members]);

  const handleDrop = async (newStatus) => {
    if (!draggedTaskId) {
      return;
    }

    const task = tasks.find(
      (item) =>
        item._id === draggedTaskId
    );

    if (!task) {
      setDraggedTaskId(null);
      return;
    }

    if (task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    const oldStatus = task.status;

    /*
      Optimistic update.
    */

    setTasks((current) =>
      current.map((item) =>
        item._id === draggedTaskId
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    setDraggedTaskId(null);

    try {
      await axiosClient.put(
        `/tasks/${task._id}`,
        {
          status: newStatus,
        }
      );
    } catch (err) {
      /*
        Rollback if API fails.
      */

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );

      setError(
        err.response?.data?.message ||
          "Could not update task status"
      );
    }
  };

  if (loading) {
    return (
      <AppLayout title="Kanban Board">
        <div className="flex min-h-60 items-center justify-center">
          <p className="text-sm text-ink-muted">
            Loading board...
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Kanban Board">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-marker">
            {project?.name || "Project Workspace"}
          </p>

          <h2 className="font-display text-2xl font-semibold text-ink">
            Work Board
          </h2>

          <p className="mt-1 text-sm text-ink-muted">
            Drag tasks between columns to update their
            progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-ink-muted">
            {tasks.length} tasks
          </span>

          <Link
            to={`/projects/${projectId}`}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper"
          >
            Project details
          </Link>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TEAM MEMBERS */}
      <div className="mb-6 rounded-xl border border-line bg-panel p-4 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Team Members
            </span>

            <p className="mt-1 text-xs text-ink-muted">
              {members.length} member
              {members.length === 1
                ? ""
                : "s"}{" "}
              in this project
            </p>
          </div>

          <span className="text-xs text-ink-muted">
            Active tasks
          </span>
        </div>

        {workload.perMember.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {workload.perMember.map(
              ({ member, count }) => (
                <div
                  key={member._id}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2"
                >
                  <AssigneeAvatar
                    name={
                      member.username ||
                      member.email ||
                      "User"
                    }
                  />

                  <span className="max-w-40 truncate text-xs font-medium text-ink">
                    {member.username ||
                      member.email ||
                      "User"}
                  </span>

                  <span className="rounded-md bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                    {count}
                  </span>
                </div>
              )
            )}

            {workload.unassigned > 0 && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-ink-muted">
                Unassigned

                <span className="rounded-md bg-panel px-1.5 py-0.5 font-mono text-[10px]">
                  {workload.unassigned}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            No project members found.
          </p>
        )}
      </div>

      {/* KANBAN */}
      <div className="flex gap-5 overflow-x-auto pb-6">
        {COLUMNS.map((column) => {
          const columnTasks =
            tasks.filter(
              (task) =>
                task.status === column.key
            );

          const styles =
            columnStyles[column.key];

          return (
            <div
              key={column.key}
              onDragOver={(e) =>
                e.preventDefault()
              }
              onDrop={() =>
                handleDrop(column.key)
              }
              className="flex w-80 min-w-80 flex-col rounded-xl border border-line bg-paper"
            >
              {/* COLUMN HEADER */}
              <div className="border-b border-line px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                    />

                    <h3 className="font-display text-sm font-semibold text-ink">
                      {column.label}
                    </h3>

                    <span className="rounded-md bg-panel px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                      {columnTasks.length}
                    </span>
                  </div>

                  <span className="text-xs text-ink-muted">
                    Tasks
                  </span>
                </div>
              </div>

              {/* TASKS */}
              <div className="min-h-80 space-y-3 p-3">
                {columnTasks.map((task) => (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    draggable
                    onDragStart={() =>
                      setDraggedTaskId(
                        task._id
                      )
                    }
                    className="group block cursor-grab rounded-xl border border-line bg-panel p-4 shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-blueprint hover:shadow-panel active:cursor-grabbing"
                  >
                    {/* TITLE */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-5 text-ink">
                        {task.title}
                      </p>

                      <span className="text-ink-muted opacity-0 transition group-hover:opacity-100">
                        ↗
                      </span>
                    </div>

                    {/* DESCRIPTION */}
                    {task.description && (
                      <p className="mb-3 line-clamp-2 text-xs leading-5 text-ink-muted">
                        {task.description}
                      </p>
                    )}

                    {/* PRIORITY / DATE */}
                    <div className="flex items-center justify-between gap-2">
                      <PriorityBadge
                        priority={task.priority}
                      />

                      {task.dueDate && (
                        <span className="font-mono text-[10px] text-ink-muted">
                          {new Date(
                            task.dueDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* ASSIGNEE */}
                    <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                      <AssigneeAvatar
                        name={
                          task.assignee
                            ? task.assignee
                                .username
                            : "Unassigned"
                        }
                      />

                      <span className="min-w-0 truncate text-xs text-ink-muted">
                        {task.assignee
                          ? task.assignee
                              .username
                          : "Unassigned"}
                      </span>
                    </div>
                  </Link>
                ))}

                {/* EMPTY COLUMN */}
                {columnTasks.length === 0 && (
                  <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-line">
                    <div className="text-center">
                      <div className="mb-2 text-lg text-ink-muted">
                        —
                      </div>

                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        No tasks
                      </p>
                    </div>
                  </div>
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