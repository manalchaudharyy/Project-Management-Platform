import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge } from "../components/Badge";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/projects", { name, description });
      setName("");
      setDescription("");
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError("Could not create project");
    }
  };

  return (
    <AppLayout title="Projects">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-ink-muted">
          {loading ? "Loading…" : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors"
        >
          {showForm ? "Cancel" : "New project"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-priority-critical">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-line bg-panel p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors"
          >
            Create project
          </button>
        </form>
      )}

      {!loading && projects.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-muted">No projects yet.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="rounded-lg border border-line bg-panel divide-y divide-line">
          {projects.map((project) => (
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

export default Projects;