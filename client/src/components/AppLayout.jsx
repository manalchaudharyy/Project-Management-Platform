import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { incrementUnread, setUnreadCount } from "../store/inboxSlice";
import { getSocket, disconnectSocket } from "../api/socket";
import axiosClient from "../api/axiosClient";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/projects", label: "Projects", icon: "▤" },
  { to: "/inbox", label: "Inbox", icon: "✉" },
  { to: "/profile", label: "Profile", icon: "◔" },
];

const AppLayout = ({ title, children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Top-bar search: term, results dropdown, and loading state.
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchBoxRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const unreadCount = useSelector((state) => state.inbox.unreadCount);

  // Keep the Inbox badge in sync globally: fetch the starting count once,
  // then bump it in real time for messages that arrive while the user is
  // elsewhere (the Inbox page itself handles counts while it's open).
  useEffect(() => {
    if (!token) return;

    axiosClient
      .get("/messages/conversations")
      .then((res) => {
        const total = res.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        dispatch(setUnreadCount(total));
      })
      .catch(() => {});

    const socket = getSocket(token);
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (location.pathname.startsWith("/inbox")) return;
      if (payload.sender?.id === user?.id) return;
      dispatch(incrementUnread(1));
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Close the search dropdown on outside click.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search against /api/search?term=...
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const term = searchTerm.trim();
    if (!term) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosClient.get("/search", { params: { term } });
        setSearchResults(res.data);
      } catch {
        setSearchResults({ projects: [], tasks: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm]);

  const handleSelectProject = (id) => {
    setSearchOpen(false);
    setSearchTerm("");
    setSearchResults(null);
    navigate(`/projects/${id}`);
  };

  const handleSelectTask = (id) => {
    setSearchOpen(false);
    setSearchTerm("");
    setSearchResults(null);
    navigate(`/tasks/${id}`);
  };

  const hasResults =
    searchResults && (searchResults.projects?.length > 0 || searchResults.tasks?.length > 0);

  const items = navItems.concat(
    ["admin", "pm"].includes(user?.role)
      ? [{ to: "/admin/users", label: "Manage Users", icon: "◈" }]
      : []
  );

  const handleLogout = () => {
    disconnectSocket();
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

  const NavLinks = ({ onNavigate }) => (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-linear-to-r from-blueprint to-blueprint-dark text-white shadow-card"
                : "text-ink-muted hover:bg-paper hover:text-ink"
            }`}
          >
            <span className={active ? "text-white" : "text-marker"}>{item.icon}</span>
            {item.label}
            {item.to === "/inbox" && unreadCount > 0 && (
              <span
                className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-marker text-white"
                }`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper md:flex">

      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white md:flex md:flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blueprint to-marker text-sm font-bold text-white">
            V
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Voxel
          </span>
        </Link>

        <div className="flex-1 py-2">
          <NavLinks />
        </div>

        <div className="border-t border-line p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-muted transition hover:bg-red-50 hover:text-red-600"
          >
            ↪ Sign out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-panel md:hidden">
            <div className="flex items-center justify-between px-5 py-5">
              <Link
                to="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blueprint to-marker text-sm font-bold text-white">
                  V
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-ink">
                  Voxel
                </span>
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-1.5 text-ink-muted hover:bg-paper"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 py-2">
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="border-t border-line p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-muted transition hover:bg-red-50 hover:text-red-600"
              >
                ↪ Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main column */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white px-4 sm:px-6">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-1.5 text-ink-muted hover:bg-paper md:hidden"
          >
            ☰
          </button>

          {title && (
            <h1 className="font-display text-base font-bold text-ink">{title}</h1>
          )}

          <div className="flex-1" />

          {/* SEARCH — live search against projects + tasks the user has access to */}
          <div className="relative hidden w-72 lg:block" ref={searchBoxRef}>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5">
              <span className="text-ink-muted">⌕</span>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => searchTerm && setSearchOpen(true)}
                placeholder="Search projects & tasks..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
              />
            </div>

            {searchOpen && searchTerm.trim() && (
              <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-panel">
                {searchLoading && (
                  <p className="px-4 py-4 text-center text-sm text-ink-muted">Searching...</p>
                )}

                {!searchLoading && !hasResults && (
                  <p className="px-4 py-4 text-center text-sm text-ink-muted">
                    No matches for "{searchTerm.trim()}"
                  </p>
                )}

                {!searchLoading && searchResults?.projects?.length > 0 && (
                  <div className="border-b border-line">
                    <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                      Projects
                    </p>
                    {searchResults.projects.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => handleSelectProject(p._id)}
                        className="block w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-paper"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {!searchLoading && searchResults?.tasks?.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                      Tasks
                    </p>
                    {searchResults.tasks.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => handleSelectTask(t._id)}
                        className="block w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-paper"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BELL — mirrors the Inbox unread count; click jumps to Inbox */}
          <button
            onClick={() => navigate("/inbox")}
            className="relative rounded-md p-2 text-ink-muted transition hover:bg-paper"
            title={unreadCount > 0 ? `${unreadCount} unread message(s)` : "No new notifications"}
          >
            ♧
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-marker px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blueprint to-marker text-xs font-bold text-white"
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
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-paper hover:text-ink"
                  >
                    ◔ View profile
                  </Link>
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
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;