import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./Navbar.css";

function getAuth() {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  return { token, role, isLoggedIn: !!token };
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const navigate = useNavigate();

  // re-read cand storage se schimba
  const [authTick, setAuthTick] = useState(0);
  const { role, isLoggedIn } = useMemo(() => getAuth(), [authTick]);

  // navbar in sync cu (login/logout, refresh)
  useEffect(() => {
    const onStorage = () => setAuthTick((x) => x + 1);
    const onFocus = () => setAuthTick((x) => x + 1);

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    close();
    setAuthTick((x) => x + 1);
    navigate("/login", { replace: true });
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink
          to={isLoggedIn ? "/dashboard" : "/login"}
          className="brand"
          onClick={close}
        >
          TaskPlanner
        </NavLink>

        <button
          className="burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`links ${open ? "open" : ""}`}>
          {!isLoggedIn ? (
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? "link active" : "link")}
              onClick={close}
            >
              Login
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "link active" : "link")}
                onClick={close}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/projects"
                className={({ isActive }) => (isActive ? "link active" : "link")}
                onClick={close}
              >
                Projects
              </NavLink>

              <NavLink
                to="/teams"
                className={({ isActive }) => (isActive ? "link active" : "link")}
                onClick={close}
              >
                Teams
              </NavLink>

              <NavLink
                to="/tasks"
                className={({ isActive }) => (isActive ? "link active" : "link")}
                onClick={close}
              >
                Tasks
              </NavLink>

              {/*doar admin vede Users */}
              {role === "admin" && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => (isActive ? "link active" : "link")}
                  onClick={close}
                >
                  Users
                </NavLink>
              )}

              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? "link active" : "link")}
                onClick={close}
                title="My Profile"
              >
                👤
              </NavLink>

              <button className="link logout" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>

      {open && <div className="overlay" onClick={close} />}
    </header>
  );
}
