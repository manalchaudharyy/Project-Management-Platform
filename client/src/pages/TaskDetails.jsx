import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";

const selectClasses =
  "rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors";

const TaskDetails = () => {
  const { id } = useParams();
  const currentUser = useSelector((state) => state.auth.user);
  const canReassign = currentUser?.role === "pm" || currentUser?.role === "admin";

  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");

  const fetchData = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        axiosClient.get(`/tasks/${id}`),
        axiosClient.get(`/tasks/${id}/comments`),
      ]);
      setTask(taskRes.data);
      setComments(commentsRes.data);

      if (canReassign && taskRes.data.project) {
        const projectRes = await axiosClient.get(`/projects/${taskRes.data.project}`);
        setMembers(projectRes.data.members || []);
      }
    } catch (err) {
      setError("Could not load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (e) => {
    const status = e.target.value;
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { status });
      setTask(res.data);
    } catch (err) {
      setError("Could not update status");
    }
  };

  const handlePriorityChange = async (e) => {
    const priority = e.target.value;
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { priority });
      setTask(res.data);
    } catch (err) {
      setError("Could not update priority");
    }
  };

  const handleAssigneeChange = async (e) => {
    const assignee = e.target.value; // "" means Unassigned
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { assignee });
      setTask(res.data);
    } catch (err) {
      setError("Could not update assignee");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/tasks/${id}/comments`, { content: newComment });
      setNewComment("");
      const res = await axiosClient.get(`/tasks/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      setError("Could not add comment");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading…">
        <p className="text-sm text-ink-muted">Loading task…</p>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout title="Task not found">
        <p className="text-sm text-priority-critical">{error || "Task not found"}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={task.title}>
      <div className="mb-6 rounded-lg border border-line bg-panel p-5">
        {task.description && <p className="text-sm text-ink-muted mb-4">{task.description}</p>}

        {error && <p className="mb-4 text-sm text-priority-critical">{error}</p>}

        <div className="flex flex-wrap gap-6">
          <div>
           <label className="block text-xs font-medium text-ink-muted mb-1.5">Status</label>
            <select value={task.status} onChange={handleStatusChange} className={selectClasses}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Priority</label>
            <select value={task.priority} onChange={handlePriorityChange} className={selectClasses}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Assignee</label>
            {canReassign ? (
              <select
                value={task.assignee?._id || ""}
                onChange={handleAssigneeChange}
                className={selectClasses}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.username}
                  </option>
                ))}
              </select>
            ) : (
              <p className="px-3 py-2 text-sm text-ink">
                {task.assignee ? task.assignee.username : "Unassigned"}
              </p>
            )}
          </div>
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold text-ink mb-4">Comments</h2>

      <form onSubmit={handleAddComment} className="mb-5 flex gap-3">
        <input
          type="text"
          placeholder="Write a comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          required
          className="flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
        />
        <button
          type="submit"
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors"
        >
          Post
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted">No comments yet.</p>
      ) : (
        <div className="rounded-lg border border-line bg-panel divide-y divide-line">
          {comments.map((comment) => (
            <div key={comment._id} className="px-5 py-3">
              <p className="text-sm text-ink">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default TaskDetails;