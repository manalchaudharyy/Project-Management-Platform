import { useState } from "react";
import { useDispatch } from "react-redux";
import axiosClient from "../api/axiosClient";
import { setCredentials } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axiosClient.post("/auth/login", { email, password });

      dispatch(
        setCredentials({
          user: res.data.user,
          token: res.data.token,
        })
      );

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

 return (
  <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-2">

    {/* Left visual */}
    <div
      className="relative hidden bg-cover bg-center lg:block"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=90')",
      }}
    >

      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blueprint font-bold">
            V
          </div>

          <span className="text-xl font-bold">
            Voxel
          </span>
        </div>

        <div className="max-w-lg">

          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-400">
            Project Management
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            Turn your 
            <span className="text-amber-400"> ideas into reality.</span>
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-300">
            Plan projects, manage tasks, collaborate with your team,
            and keep everything organized in one workspace.
          </p>

        </div>

        <p className="text-sm text-white/40">
          © 2026 Voxel Workspace
        </p>

      </div>

    </div>

    {/* Login */}
    <div className="flex items-center justify-center bg-white px-6 py-12">

      <div className="w-full max-w-md">

        <div className="mb-10">

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blueprint text-xl font-bold text-white shadow-lg shadow-blueprint/30 lg:hidden">
            V
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue to your workspace.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blueprint focus:bg-white focus:ring-4 focus:ring-blueprint/10"
            />

          </div>


          <div>
              <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-sm font-medium text-blueprint hover:text-blueprint-dark">
              Forgot password?
              </Link>
           </div>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    placeholder="••••••••"
    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blueprint focus:bg-white focus:ring-4 focus:ring-blueprint/10"
  />
</div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blueprint py-3.5 text-sm font-semibold text-white shadow-lg shadow-blueprint/20 transition hover:bg-blueprint-dark hover:shadow-xl"
          >
            Sign in to Voxel →
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-blueprint hover:text-blueprint-dark">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          Secure workspace • Built for productive teams
        </p>

      </div>

    </div>

  </div>
);
};

export default Login;