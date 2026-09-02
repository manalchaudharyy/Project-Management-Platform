import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/profile", label: "Profile" },
];

const AppLayout = ({ title, children }) => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-paper font-sans">
      <aside className="w-60 shrink-0 bg-blueprint text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <span className="font-display text-lg font-semibold tracking-tight">Foreman</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .concat(user?.role === "admin" ? [{ to: "/admin/users", label: "Manage Users" }] : [])
            .map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-sm text-white/90 truncate">{user?.username}</p>
          <p className="text-xs text-white/50 font-mono">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="mt-3 text-xs text-white/60 hover:text-marker transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {title && (
          <header className="border-b border-line bg-panel px-8 py-5">
            <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          </header>
        )}
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;