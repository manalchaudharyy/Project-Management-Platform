import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import TaskBreakdown from "../components/TaskBreakdown";
const selectClasses =
  "rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors";

// Splits comment content on ```code``` fences and renders each segment —
// fenced parts as monospace blocks, everything else as whitespace-preserving
// plain text (so line breaks/indentation from the textarea aren't collapsed).
const renderCommentContent = (content) => {
  if (!content) return null;
  const parts = content.split(/```([\s\S]*?)```/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <pre
        key={i}
        className="my-1.5 overflow-x-auto rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
      >
        {part.replace(/^\n/, "").replace(/\n$/, "")}
      </pre>
    ) : (
      part && (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      )
    )
  );
};

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
  const [newCommentFile, setNewCommentFile] = useState(null);
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  // Members can also upload attachments (same as reassignment access), not just PM/Admin
  const canUpload =
    canReassign || members.some((m) => m._id === currentUser?.id);

  const fetchData = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        axiosClient.get(`/tasks/${id}`),
        axiosClient.get(`/tasks/${id}/comments`),
      ]);
      setTask(taskRes.data);
      setComments(commentsRes.data);

      // Everyone needs the member list now — members can reassign tasks too,
      // not just PM/Admin.
      if (taskRes.data.project) {
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
      setError(err.response?.data?.message || "Could not update status");
    }
  };

  const handlePriorityChange = async (e) => {
    const priority = e.target.value;
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { priority });
      setTask(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update priority");
    }
  };

  const handleAssigneeChange = async (e) => {
    const assignee = e.target.value; // "" means Unassigned
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { assignee });
      setTask(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update assignee");
    }
  };

  const handleSaveDescription = async () => {
    try {
      const res = await axiosClient.put(`/tasks/${id}`, { description: descriptionDraft });
      setTask(res.data);
      setEditingDescription(false);
    } catch (err) {
      setError("Could not update description");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && !newCommentFile) return;

    // A comment can carry a file, so it always goes over as multipart —
    // simpler than branching between JSON and FormData based on whether a
    // file was picked.
    const formData = new FormData();
    formData.append("content", newComment);
    if (newCommentFile) {
      formData.append("file", newCommentFile);
    }

    setPostingComment(true);
    try {
      await axiosClient.post(`/tasks/${id}/comments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewComment("");
      setNewCommentFile(null);
      const res = await axiosClient.get(`/tasks/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleCommentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      e.target.value = "";
      return;
    }
    setNewCommentFile(file);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Frontend-side size guard so a big file doesn't get uploaded just to be
    // rejected by the backend's 10MB limit.
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axiosClient.post(`/tasks/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTask(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload attachment");
    } finally {
      setUploading(false);
      e.target.value = ""; // same file dobara select karne ke liye reset
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentDraft(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentDraft("");
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentDraft.trim()) return;
    try {
      await axiosClient.put(`/comments/${commentId}`, { content: editCommentDraft });
      const res = await axiosClient.get(`/tasks/${id}/comments`);
      setComments(res.data);
      cancelEditComment();
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
        <div className="mb-4 rounded-md border border-line bg-paper p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Description
            </h3>
            {canReassign && !editingDescription && (
              <button
                type="button"
                onClick={() => {
                  setDescriptionDraft(task.description || "");
                  setEditingDescription(true);
                }}
                className="rounded-md px-2 py-1 text-xs font-medium text-blueprint hover:bg-blueprint/10 transition-colors"
              >
                {task.description ? "Edit" : "Add description"}
              </button>
            )}
          </div>

          {editingDescription ? (
            <div>
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Describe what needs to be done…"
                className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors resize-y"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  className="rounded-md bg-blueprint px-3 py-1.5 text-xs font-medium text-white hover:bg-blueprint-dark transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDescription(false)}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-panel transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : task.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
              {task.description}
            </p>
          ) : (
            <p className="text-sm italic text-ink-muted/70">No description yet.</p>
          )}
        </div>

        <div className="mb-4 rounded-md border border-line bg-paper p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Attachments
            </h3>
            {canUpload && (
              <label className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-blueprint hover:bg-blueprint/10 transition-colors">
                {uploading ? "Uploading…" : "+ Add file"}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {task.attachments && task.attachments.length > 0 ? (
            <ul className="space-y-2">
              {task.attachments.map((att, idx) => (
                <li
                  key={att._id || idx}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-blueprint hover:underline"
                  >
                    {att.filename}
                  </a>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {att.uploadedBy?.username || "Unknown"} ·{" "}
                    {new Date(att.uploadedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-ink-muted/70">No attachments yet.</p>
          )}
        </div>

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
      <TaskBreakdown taskId={task._id} projectId={task.project} />

<h2 className="font-display text-lg font-semibold text-ink mb-4">Comments</h2>

      <form onSubmit={handleAddComment} className="mb-5">
        <textarea
          placeholder="Write a comment… wrap code in ``` for a code block"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors resize-y"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <label className="cursor-pointer text-xs font-medium text-blueprint hover:text-marker">
            {newCommentFile ? `📎 ${newCommentFile.name}` : "+ Attach file"}
            <input type="file" onChange={handleCommentFileChange} className="hidden" />
          </label>
          <div className="flex items-center gap-2">
            {newCommentFile && (
              <button
                type="button"
                onClick={() => setNewCommentFile(null)}
                className="text-xs font-medium text-ink-muted hover:text-priority-critical"
              >
                Remove
              </button>
            )}
            <button
              type="submit"
              disabled={postingComment || (!newComment.trim() && !newCommentFile)}
              className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors disabled:opacity-60"
            >
              {postingComment ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted">No comments yet.</p>
      ) : (
        <div className="rounded-lg border border-line bg-panel divide-y divide-line">
          {comments.map((comment) => {
            const isOwn = comment.author?._id === currentUser?.id;
            const isEditing = editingCommentId === comment._id;

            return (
              <div key={comment._id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-xs font-mono text-ink-muted">
                    {comment.author?.username || "Unknown"} ·{" "}
                    {new Date(comment.createdAt).toLocaleString()}
                    {comment.updatedAt !== comment.createdAt && " (edited)"}
                  </p>
                  {isOwn && !isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditComment(comment)}
                        className="text-xs font-medium text-blueprint hover:text-marker"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs font-medium text-priority-critical hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <textarea
                      value={editCommentDraft}
                      onChange={(e) => setEditCommentDraft(e.target.value)}
                      rows={2}
                      className="flex-1 rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors resize-y"
                    />
                    <button
                      onClick={() => handleUpdateComment(comment._id)}
                      className="rounded-md bg-blueprint px-3 py-1.5 text-xs font-medium text-white hover:bg-blueprint-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditComment}
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    {comment.content && (
                      <div className="text-sm text-ink">{renderCommentContent(comment.content)}</div>
                    )}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {comment.attachments.map((att, idx) => (
                          <li key={att._id || idx} className="text-sm">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blueprint hover:underline"
                            >
                              📎 {att.filename}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
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