import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import "./Dashboard.css";

const STATUS_KEYS = ["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"];

function normalizeStatus(s) {
  const v = String(s || "OPEN").toUpperCase();
  return STATUS_KEYS.includes(v) ? v : "OPEN";
}

function computeStats(projects) {
  const total = projects.length;

  const byStatus = projects.reduce(
    (acc, p) => {
      const s = normalizeStatus(p.status);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 }
  );

  const progressBase = total - byStatus.CLOSED;
  const completedPct =
    progressBase <= 0 ? 0 : Math.round((byStatus.COMPLETED / progressBase) * 100);

  return { total, byStatus, completedPct };
}

function pillClassFromStatus(status) {
  const s = normalizeStatus(status);
  if (s === "COMPLETED") return "pill done";
  if (s === "IN_PROGRESS") return "pill active";
  if (s === "CLOSED") return "pill paused";
  return "pill active";
}

function labelStatus(status) {
  const s = normalizeStatus(status);
  if (s === "IN_PROGRESS") return "in progress";
  return s.toLowerCase();
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    // ✅ dacă nu ești logată, nu cere /projects (altfel 401)
    if (!token) {
      setLoading(false);
      setProjects([]);
      setError("");
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");

    api
      .get("/projects")
      .then((res) => {
        const items = res?.data?.data ?? [];
        if (mounted) setProjects(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        console.error("Dashboard: eroare la preluare proiecte:", err);
        if (mounted) setError("Nu am putut încărca datele pentru dashboard.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => computeStats(projects), [projects]);

  const recent = useMemo(() => {
    const list = [...projects];
    list.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0;
      return bTime - aTime;
    });
    return list.slice(0, 6);
  }, [projects]);

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h2>Dashboard</h2>
          <p className="sub">Overview rapid al proiectelor tale.</p>
        </div>

        <div className="actions">
          <Link className="btn" to="/projects">
            Vezi Projects
          </Link>
          <Link className="btn primary" to="/projects">
            + New project
          </Link>
        </div>
      </div>

      {loading && (
        <div className="state">
          <div className="spinner" />
          <p>Se încarcă...</p>
        </div>
      )}

      {!loading && error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="cards">
            <div className="card">
              <div className="card-kpi">{stats.total}</div>
              <div className="card-label">Total proiecte</div>
            </div>

            <div className="card">
              <div className="card-kpi">{stats.byStatus.OPEN}</div>
              <div className="card-label">Open</div>
            </div>

            <div className="card">
              <div className="card-kpi">{stats.byStatus.IN_PROGRESS}</div>
              <div className="card-label">In progress</div>
            </div>

            <div className="card">
              <div className="card-kpi">{stats.byStatus.COMPLETED}</div>
              <div className="card-label">Completed</div>
            </div>
          </div>

          <div className="dash-grid">
            <section className="panel">
              <div className="panel-head">
                <h3>Progres</h3>
                <span className="muted">{stats.completedPct}% completed</span>
              </div>

              <div className="progress">
                <div className="bar">
                  <div className="fill" style={{ width: `${stats.completedPct}%` }} />
                </div>

                <div className="legend">
                  <div><span className="dot a" /> open: {stats.byStatus.OPEN}</div>
                  <div><span className="dot p" /> in progress: {stats.byStatus.IN_PROGRESS}</div>
                  <div><span className="dot d" /> completed: {stats.byStatus.COMPLETED}</div>
                  <div><span className="dot" /> closed: {stats.byStatus.CLOSED}</div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h3>Proiecte recente</h3>
                <Link className="link" to="/projects">vezi toate</Link>
              </div>

              {recent.length === 0 ? (
                <div className="empty">
                  <p>N-ai proiecte încă.</p>
                  <Link className="btn primary" to="/projects">
                    Creează primul proiect
                  </Link>
                </div>
              ) : (
                <div className="recent">
                  {recent.map((p) => (
                    <div key={p.id} className="recent-item">
                      <div className="ri-left">
                        <div className="ri-title">{p.name}</div>
                        <div className="ri-desc">{p.description || "Fără descriere."}</div>
                      </div>

                      <span className={pillClassFromStatus(p.status)}>
                        {labelStatus(p.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
