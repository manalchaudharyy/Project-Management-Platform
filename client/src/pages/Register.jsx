import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { setCredentials } from "../store/authSlice";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axiosClient.post("/auth/register", {
        username,
        email,
        password,
      });

      dispatch(
        setCredentials({
          user: res.data.user,
          token: res.data.token,
        })
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-semibold text-ink">Foreman</span>
          <p className="mt-1 text-sm text-ink-muted">Set up your workspace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-line rounded-lg p-6 space-y-4"
        >
          {error && (
            <p className="rounded-md bg-priority-critical/10 px-3 py-2 text-sm text-priority-critical">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blueprint py-2.5 text-sm font-medium text-white hover:bg-blueprint-dark transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-blueprint hover:text-marker font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;