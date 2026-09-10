import { useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Forgot password</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your account email and we'll send you a link to reset your password.
          </p>
        </div>

        {message ? (
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blueprint focus:bg-white focus:ring-4 focus:ring-blueprint/10"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blueprint py-3.5 text-sm font-semibold text-white shadow-lg shadow-blueprint/20 transition hover:bg-blueprint-dark hover:shadow-xl disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
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

export default ForgotPassword;