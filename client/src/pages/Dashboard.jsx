import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosClient.get("/projects");
        setProjects(res.data);
      } catch (err) {
        setError("Could not load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div>
      <h1>Welcome{user ? `, ${user.username}` : ""}</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Your Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project._id}>
            <Link to={`/projects/${project._id}`}>{project.name}</Link> — {project.status}
          </li>
        ))}
      </ul>

      <Link to="/projects">See all projects</Link>
    </div>
  );
};

export default Dashboard;