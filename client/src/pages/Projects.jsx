import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import { StatusBadge } from "../components/Badge";

const Projects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("planning");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const fetchProjects = async () => {
    try {
      setError("");

      const res = await axiosClient.get("/projects");

      setProjects(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load projects"
      );
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
      setError("");

      await axiosClient.post("/projects", {
        name: name.trim(),
        description: description.trim(),
      });

      setName("");
      setDescription("");
      setShowForm(false);

      await fetchProjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create project"
      );
    }
  };

  const startEdit = (project) => {
    setEditingProject(project);

    setEditName(project.name || "");
    setEditDescription(project.description || "");
    setEditStatus(project.status || "planning");

    setEditStartDate(
      project.startDate
        ? new Date(project.startDate)
            .toISOString()
            .split("T")[0]
        : ""
    );

    setEditEndDate(
      project.endDate
        ? new Date(project.endDate)
            .toISOString()
            .split("T")[0]
        : ""
    );

    setError("");
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
    setEditStatus("planning");
    setEditStartDate("");
    setEditEndDate("");
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    if (!editingProject) return;

    try {
      setError("");

      await axiosClient.put(
        `/projects/${editingProject._id}`,
        {
          name: editName.trim(),
          description: editDescription.trim(),
          status: editStatus,
          ...(editStartDate
            ? { startDate: editStartDate }
            : {}),
          ...(editEndDate
            ? { endDate: editEndDate }
            : {}),
        }
      );

      cancelEdit();

      await fetchProjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update project"
      );
    }
  };

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis will also delete all tasks belonging to this project.`
    );

    if (!confirmed) return;

    try {
      setError("");

      await axiosClient.delete(
        `/projects/${project._id}`
      );

      setProjects((current) =>
        current.filter(
          (item) => item._id !== project._id
        )
      );

      if (
        editingProject &&
        editingProject._id === project._id
      ) {
        cancelEdit();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete project"
      );
    }
  };

  return (
    <AppLayout title="Projects">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {loading
            ? "Loading..."
            : `${projects.length} project${
                projects.length === 1 ? "" : "s"
              }`}
        </p>

        <button
          onClick={() =>
            setShowForm((value) => !value)
          }
          className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blueprint-dark"
        >
          {showForm ? "Cancel" : "New project"}
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* CREATE PROJECT */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-4 rounded-lg border border-line bg-panel p-5 shadow-card"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Project Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              placeholder="Enter project name"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Enter project description"
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blueprint-dark"
          >
            Create Project
          </button>
        </form>
      )}

      {/* EDIT PROJECT */}
      {editingProject && (
        <form
          onSubmit={handleEdit}
          className="mb-6 space-y-4 rounded-lg border border-blueprint/20 bg-panel p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Edit Project
            </h2>

            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Project Name
            </label>

            <input
              type="text"
              value={editName}
              onChange={(e) =>
                setEditName(e.target.value)
              }
              required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Description
            </label>

            <textarea
              value={editDescription}
              onChange={(e) =>
                setEditDescription(e.target.value)
              }
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Status
              </label>

              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value)
                }
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              >
                <option value="planning">
                  Planning
                </option>

                <option value="active">
                  Active
                </option>

                <option value="on-hold">
                  On Hold
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Start Date
              </label>

              <input
                type="date"
                value={editStartDate}
                onChange={(e) =>
                  setEditStartDate(e.target.value)
                }
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                End Date
              </label>

              <input
                type="date"
                value={editEndDate}
                onChange={(e) =>
                  setEditEndDate(e.target.value)
                }
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-blueprint px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blueprint-dark"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* EMPTY STATE */}
      {!loading &&
        projects.length === 0 &&
        !showForm && (
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-muted">
              No projects yet.
            </p>
          </div>
        )}

      {/* PROJECT LIST */}
      {projects.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
          {projects.map((project) => (
            <div
              key={project._id}
              className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0 hover:bg-paper"
            >
              <Link
                to={`/projects/${project._id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate font-medium text-ink">
                  {project.name}
                </p>

                {project.description && (
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {project.description}
                  </p>
                )}
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge
                  status={project.status}
                />

                <button
                  type="button"
                  onClick={() =>
                    startEdit(project)
                  }
                  className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-ink transition hover:border-blueprint hover:text-blueprint"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(project)
                  }
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Projects;