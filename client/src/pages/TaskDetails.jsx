import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";

const selectClasses =
  "rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors";

const inputClasses =
  "flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors";

const TaskDetails = () => {
  const { id } = useParams();
  const currentUser = useSelector((state) => state.auth.user);

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");

  // Which comment (by id) is currently being edited, and its draft text.
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const fetchData = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        axiosClient.get(`/tasks/${id}`),
        axiosClient.get(`/tasks/${id}/comments`),
      ]);
      setTask(taskRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      setError("Could not load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post(`/tasks/${id}/comments`, { content: newComment });
      setNewComment("");
      setComments((prev) => [...prev, res.data]);
    } catch (err) {
      setError("Could not add comment");
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await axiosClient.put(`/comments/${commentId}`, { content: editText });
      setComments((prev) => prev.map((c) => (c._id === commentId ? res.data : c)));
      cancelEdit();
    } catch (err) {
      setError("Could not update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axiosClient.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      setError("Could not delete comment");
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

        <div className="flex gap-6">
          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Status</label>
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
          className={inputClasses}
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
          {comments.map((comment) => {
            const isOwn = comment.author?._id === currentUser?.id;
            const isEditing = editingId === comment._id;

            return (
              <div key={comment._id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-mono text-ink-muted">
                    {comment.author?.username || "Unknown"}
                    {isOwn && <span className="text-blueprint"> (you)</span>}
                  </p>
                  {isOwn && !isEditing && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(comment)}
                        className="text-xs text-ink-muted hover:text-marker"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs text-ink-muted hover:text-priority-critical"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={inputClasses}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(comment._id)}
                      className="rounded-md bg-blueprint px-3 py-2 text-xs font-medium text-white hover:bg-blueprint-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-md border border-line px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-ink">{comment.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default TaskDetails;