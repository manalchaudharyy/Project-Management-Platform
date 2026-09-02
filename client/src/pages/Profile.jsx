import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { logout } from "../store/authSlice";
import AppLayout from "../components/AppLayout";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosClient.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        setError("Could not load profile");
      }
    };
    fetchMe();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (error) {
    return (
      <AppLayout title="Profile">
        <p className="text-sm text-priority-critical">{error}</p>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Profile">
        <p className="text-sm text-ink-muted">Loading profile…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="max-w-md rounded-lg border border-line bg-panel p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blueprint font-display text-lg font-semibold text-white">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink">{user.username}</p>
            <p className="text-sm text-ink-muted font-mono">{user.role}</p>
          </div>
        </div>

        <dl className="space-y-3 text-sm border-t border-line pt-4">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Email</dt>
            <dd className="text-ink">{user.email}</dd>
          </div>
        </dl>

        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-md border border-line py-2.5 text-sm font-medium text-ink hover:border-priority-critical hover:text-priority-critical transition-colors"
        >
          Log out
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;