import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const TaskDetails = () => {
  const { id } = useParams();

  const [task, setTask] = useState(null);
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
      await axiosClient.post(`/tasks/${id}/comments`, { content: newComment });
      setNewComment("");
      const res = await axiosClient.get(`/tasks/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      setError("Could not add comment");
    }
  };

  if (loading) return <p>Loading task...</p>;
  if (!task) return <p>{error || "Task not found"}</p>;

  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <label>
        Status:
        <select value={task.status} onChange={handleStatusChange}>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </label>

      <label>
        Priority:
        <select value={task.priority} onChange={handlePriorityChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>

      <h2>Comments</h2>
      <form onSubmit={handleAddComment}>
        <input
          type="text"
          placeholder="Write a comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button type="submit">Post</button>
      </form>

      <ul>
        {comments.map((comment) => (
          <li key={comment._id}>{comment.content}</li>
        ))}
      </ul>
    </div>
  );
};

export default TaskDetails;