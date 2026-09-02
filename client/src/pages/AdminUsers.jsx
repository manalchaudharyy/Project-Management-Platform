import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = async () => {
    try {
      const res = await axiosClient.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axiosClient.post("/users", form);
      setSuccess(`${form.role} account created for ${form.email}`);
      setForm({ username: "", email: "", password: "", role: "member" });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <AppLayout title="Manage Users">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-lg p-6 space-y-4 h-fit">
          <h2 className="font-display text-base font-semibold text-ink">Create PM / Member account</h2>

          {error && (
            <p className="rounded-md bg-priority-critical/10 px-3 py-2 text-sm text-priority-critical">{error}</p>
          )}
          {success && (
            <p className="rounded-md bg-status-done/10 px-3 py-2 text-sm text-status-done">{success}</p>
          )}

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Username</label>
            <input name="username" value={form.username} onChange={handleChange} required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Role</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors">
              <option value="member">Member</option>
              <option value="pm">PM</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="w-full rounded-md bg-blueprint py-2.5 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors">
            Create account
          </button>
        </form>

        <div className="bg-panel border border-line rounded-lg p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">All users</h2>
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u._id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                <div>
                  <p className="text-ink">{u.username}</p>
                  <p className="text-ink-muted text-xs">{u.email}</p>
                </div>
                <span className="font-mono text-xs text-ink-muted uppercase">{u.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminUsers;