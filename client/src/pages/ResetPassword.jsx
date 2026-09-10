import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset link is invalid or has expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blueprint text-xl font-bold text-white shadow-lg shadow-blueprint/30">
            V
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reset your password</h2>
          <p className="mt-2 text-sm text-slate-500">Choose a new password for your account.</p>
        </div>

        {success ? (
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
            Password has been reset. Redirecting you to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blueprint focus:bg-white focus:ring-4 focus:ring-blueprint/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blueprint focus:bg-white focus:ring-4 focus:ring-blueprint/10"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blueprint py-3.5 text-sm font-semibold text-white shadow-lg shadow-blueprint/20 transition hover:bg-blueprint-dark hover:shadow-xl disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-blueprint hover:text-blueprint-dark">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;