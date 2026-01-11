import { NavLink } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";
import { useEffect }  from "react";
import { api } from "../api/api";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    api.get("notifications/count")
    .then((res) => {
        const value = res?.data?.data?.unread ?? 0;
        if (mounted) setUnread(value);
    })
    .catch((err) => {});
    return () => { mounted = false; };
  },[]);
  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand" onClick={close}>
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
            <NavLink
                to="/"
                end
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

            <NavLink
                to="/notifications"
                className={({ isActive }) => (isActive ? "link active notif" : "link notif")}
                onClick={close}
            >
                🔔
                {unread > 0 && <span className="badge">{unread}</span>}
            </NavLink>
            
            <NavLink to="/profile" className={({isActive}) => isActive ? "link active" : "link"} onClick={close} title="My Profile">
                👤
            </NavLink>

        </nav>
      </div>

      {/* overlay for mobile */}
      {open && <div className="overlay" onClick={close} />}
    </header>
  );
}
