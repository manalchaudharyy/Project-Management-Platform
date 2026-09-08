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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const items = navItems.concat(
    ["admin", "pm"].includes(user?.role)
      ? [{ to: "/admin/users", label: "Manage Users" }]
      : []
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials =
    user?.username
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-paper">

      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-350 items-center gap-2 px-4 sm:px-6">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 pr-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blueprint text-xs font-bold text-white">
              L
            </div>
            <span className="hidden text-sm font-semibold tracking-tight text-ink sm:inline">
              Loom
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-md border-b-2 px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-marker text-ink"
                      : "border-transparent text-ink-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile nav toggle */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="rounded-md p-1.5 text-ink-muted hover:bg-paper md:hidden"
          >
            ☰
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden w-52 lg:block">
            <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5">
              <span className="text-ink-muted">⌕</span>
              <input
                placeholder="Search..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
              />
            </div>
          </div>

          {/* Notification */}
          <button className="relative rounded-md p-2 text-ink-muted transition hover:bg-paper">
            ♧
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-marker" />
          </button>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blueprint text-xs font-bold text-white"
            >
              {initials}
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-line bg-white p-1 shadow-panel">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {user?.username}
                    </p>
                    <p className="text-xs capitalize text-ink-muted">
                      {user?.role}
                    </p>
                  </div>
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                  >
                    ↪ Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nav links (mobile) */}
        {mobileNavOpen && (
          <nav className="flex flex-col gap-0.5 border-t border-line px-4 py-2 md:hidden">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-paper text-ink"
                      : "text-ink-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Page title bar */}
      {title && (
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-350 px-4 py-3 sm:px-6">
            <h1 className="text-base font-semibold text-ink">{title}</h1>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="mx-auto max-w-350 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;