import { Link, useLocation } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();
  const location = useLocation();

  // dacă vrei să NU apară pe login (în caz că nu ai hide în App)
  if (location.pathname === "/login") return null;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="left">
          <span className="brand">TaskPlanner</span>
          <span className="sep">•</span>
          <span className="muted">Organizează proiecte, echipe și task-uri</span>
        </div>

        <div className="right">
          <span className="muted">© {year}</span>
          <span className="sep">•</span>
          <Link className="link" to="/projects">Projects</Link>
          <Link className="link" to="/teams">Teams</Link>
          <Link className="link" to="/tasks">Tasks</Link>
        </div>
      </div>
    </footer>
  );
}
