import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/profile", label: "Profile" },
];

const AppLayout = ({ title, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const items = navItems.concat(
    ["admin", "pm"].includes(user?.role) ? [{ to: "/admin/users", label: "Manage Users" }] : []
  );

  const SidebarContent = (
    <>
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
       <span className="font-display italic text-lg font-semibold tracking-tight">Loom</span>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-white/70 hover:text-white text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
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
    </>
  );

  return (
    <div className="min-h-screen flex bg-paper font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-blueprint-dark text-white flex-col">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-blueprint-dark text-white flex flex-col">{SidebarContent}</div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-line bg-panel px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-ink text-xl leading-none"
          >
            ☰
          </button>
          {title && (
            <h1 className="font-display text-lg sm:text-xl font-semibold text-ink truncate">
              {title}
            </h1>
          )}
        </header>
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;