import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";
import { api } from "../api/api";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isLoggedIn = !!token;

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;
    api
      .get("/notifications/count")
      .then((res) => {
        const value = res?.data?.data?.unread ?? 0;
        if (mounted) setUnread(value);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setUnread(0);
    close();
    navigate("/login");
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to={isLoggedIn ? "/dashboard" : "/login"} className="brand" onClick={close}>
          TaskPlanner
        </NavLink>

        <button
          className="burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
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

              {/* Extra link-uri pe rol (opțional, dar frumos pentru prezentare) */}
              {role === "admin" && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => (isActive ? "link active" : "link")}
                  onClick={close}
                >
                  Users
                </NavLink>
              )}

              {role === "manager" && (
                <NavLink
                  to="/manager/tasks"
                  className={({ isActive }) => (isActive ? "link active" : "link")}
                  onClick={close}
                >
                  Manager
                </NavLink>
              )}

              {role === "executor" && (
                <NavLink
                  to="/my-tasks"
                  className={({ isActive }) => (isActive ? "link active" : "link")}
                  onClick={close}
                >
                  My Tasks
                </NavLink>
              )}

              <NavLink
                to="/notifications"
                className={({ isActive }) => (isActive ? "link active notif" : "link notif")}
                onClick={close}
                title="Notifications"
              >
                🔔
                {unread > 0 && <span className="badge">{unread}</span>}
              </NavLink>

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
