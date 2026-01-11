import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

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
          <a className="link" href="/projects">Projects</a>
          <a className="link" href="/teams">Teams</a>
          <a className="link" href="/tasks">Tasks</a>
        </div>
      </div>
    </footer>
  );
}
