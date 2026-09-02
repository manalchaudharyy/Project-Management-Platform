import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const ProjectDetails = () => {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");

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
      await axiosClient.post("/tasks", { title, project: id });
      setTitle("");
      fetchData();
    } catch (err) {
      setError("Could not create task");
    }
  };

  if (loading) return <p>Loading project...</p>;
  if (!project) return <p>{error || "Project not found"}</p>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Status: {project.status}</p>

      <Link to={`/projects/${id}/kanban`}>View Kanban Board</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Tasks</h2>
      <form onSubmit={handleCreateTask}>
        <input
          type="text"
          placeholder="New task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button type="submit">Add Task</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task._id}>
            <Link to={`/tasks/${task._id}`}>{task.title}</Link> — {task.status} — {task.priority}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectDetails;