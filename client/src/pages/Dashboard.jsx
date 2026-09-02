import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge } from "../components/Badge";

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
    <AppLayout title={`Welcome${user ? `, ${user.username}` : ""}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold text-ink">Your projects</h2>
        <Link to="/projects" className="text-sm font-medium text-blueprint hover:text-marker">
          View all
        </Link>
      </div>

      {loading && <p className="text-sm text-ink-muted">Loading…</p>}
      {error && <p className="text-sm text-priority-critical">{error}</p>}

      {!loading && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">No projects yet. Start one to see it here.</p>
          <Link
            to="/projects"
            className="mt-3 inline-block text-sm font-medium text-blueprint hover:text-marker"
          >
            Create a project
          </Link>
        </div>
      )}

      {projects.length > 0 && (
        <div className="rounded-lg border border-line bg-panel divide-y divide-line">
          {projects.slice(0, 8).map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-paper transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{project.name}</p>
                {project.description && (
                  <p className="text-sm text-ink-muted mt-0.5 truncate">{project.description}</p>
                )}
              </div>
              <StatusBadge status={project.status} />
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;