import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import "./Projects.css";

const STATUS_UI = [
  { value: "all", label: "Toate" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Cele mai noi" },
  { value: "oldest", label: "Cele mai vechi" },
  { value: "az", label: "A–Z" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const emptyDraft = {
  name: "",
  description: "",
  status: "OPEN",
  priority: "MEDIUM",
  startDate: "",
  endDate: "",
  teamId: "",
};

function normalizeRole(r) {
  const v = String(r || "").toLowerCase();
  if (v === "admin" || v === "manager" || v === "executor") return v;
  return "";
}

function normalizeStatus(s) {
  const v = String(s || "OPEN").toUpperCase();
  if (["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(v)) return v;
  return "OPEN";
}

function normalizePriority(p) {
  const v = String(p || "MEDIUM").toUpperCase();
  if (["LOW", "MEDIUM", "HIGH"].includes(v)) return v;
  return "MEDIUM";
}

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ro-RO");
}

function toDateInputValue(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function statusToPill(status) {
  const s = normalizeStatus(status);
  if (s === "COMPLETED") return "pill done";
  if (s === "CLOSED") return "pill paused";
  if (s === "IN_PROGRESS") return "pill active";
  return "pill active"; // OPEN
}

function priorityToClass(priority) {
  const p = normalizePriority(priority);
  if (p === "HIGH") return "prio high";
  if (p === "LOW") return "prio low";
  return "prio medium";
}

export default function Projects() {
  const token = localStorage.getItem("token");
  const role = normalizeRole(localStorage.getItem("role"));

  const isExecutor = role === "executor";
  const isManagerOrAdmin = role === "manager" || role === "admin";

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  // teams (dropdown)
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const teamById = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [teams]);

  async function fetchTeams() {
    if (!token) return;
    setTeamsLoading(true);
    try {
      const res = await api.get("/teams");
      const items = res?.data?.data ?? [];
      setTeams(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Eroare la preluare teams:", err);
    } finally {
      setTeamsLoading(false);
    }
  }

  async function fetchProjects() {
    if (!token) {
      setLoading(false);
      setProjects([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/projects", { params });
      const items = res?.data?.data ?? [];
      setProjects(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Eroare la preluare proiecte:", err);
      setError("Nu am putut încărca proiectele. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...projects];

    if (q) {
      list = list.filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const desc = (p.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortBy === "az") return (a.name ?? "").localeCompare(b.name ?? "");

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0;

      if (sortBy === "newest") return bTime - aTime;
      return aTime - bTime;
    });

    return list;
  }, [projects, query, sortBy]);

  function openCreate() {
    if (!isManagerOrAdmin) return;
    setMode("create");
    setActiveId(null);
    setDraft(emptyDraft);
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(p) {
    if (!isManagerOrAdmin) return;
    setMode("edit");
    setActiveId(p.id);
    setDraft({
      name: p.name ?? "",
      description: p.description ?? "",
      status: normalizeStatus(p.status),
      priority: normalizePriority(p.priority),
      startDate: toDateInputValue(p.startDate),
      endDate: toDateInputValue(p.endDate),
      teamId: p.teamId ? String(p.teamId) : "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setDraft(emptyDraft);
    setActiveId(null);
  }

  function validateDraft(d) {
    if (!d.name.trim()) return "Completează numele proiectului.";
    if (d.name.trim().length < 3) return "Numele proiectului trebuie să aibă minim 3 caractere.";
    if (!d.status) return "Alege un status.";
    if (!d.priority) return "Alege o prioritate.";
    if (d.startDate && d.endDate && d.endDate < d.startDate) {
      return "End date nu poate fi înainte de start date.";
    }
    return "";
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!isManagerOrAdmin) return;

    const msg = validateDraft(draft);
    if (msg) return setError(msg);

    setSaving(true);
    setError("");

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      status: normalizeStatus(draft.status),
      priority: normalizePriority(draft.priority),
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      teamId: draft.teamId ? Number(draft.teamId) : null,
    };

    try {
      if (mode === "create") {
        await api.post("/projects", payload);
      } else {
        await api.put(`/projects/${activeId}`, payload);
      }

      await fetchProjects();
      closeModal();
    } catch (err) {
      console.error("Eroare la salvare:", err);
      setError(err?.response?.data?.message || "Nu am putut salva proiectul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!isManagerOrAdmin) return;

    const ok = window.confirm(`Ștergi proiectul "${p.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/projects/${p.id}`);
      await fetchProjects();
    } catch (err) {
      console.error("Eroare la ștergere:", err);
      alert("Nu am putut șterge proiectul. Încearcă din nou.");
    }
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h2>Projects</h2>
          <p className="subtitle">
            {isExecutor
              ? "Poți vedea proiectele (read-only)."
              : "Caută, filtrează, adaugă și editează proiecte."}
          </p>
        </div>

        <div className="header-actions">
          <button className="btn" onClick={fetchProjects} disabled={loading || !token}>
            Refresh
          </button>

          {isManagerOrAdmin && (
            <button className="btn primary" onClick={openCreate} disabled={!token}>
              + New project
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută după nume sau descriere..."
          />
        </div>

        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_UI.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            className="btn"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setSortBy("newest");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {loading && (
        <div className="state">
          <div className="spinner" />
          <p>Se încarcă proiectele...</p>
        </div>
      )}

      {!loading && error && <div className="error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty">
          <h3>Niciun proiect găsit</h3>
          <p>Schimbă filtrul sau revino mai târziu.</p>
          {isManagerOrAdmin && (
            <button className="btn primary" onClick={openCreate}>
              Creează proiect
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="project-grid">
          {filtered.map((p) => (
            <div key={p.id} className="project-card">
              <div className="card-top">
                <div className="title-wrap">
                  <h3 className="title">{p.name}</h3>

                  <div className="badges">
                    <span className={statusToPill(p.status)}>{normalizeStatus(p.status)}</span>
                    <span className={priorityToClass(p.priority)}>{normalizePriority(p.priority)}</span>
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <div className="menu">
                    <button className="icon-btn" onClick={() => openEdit(p)} title="Edit">
                      ✏️
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(p)} title="Delete">
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <p className="desc">{p.description || "Fără descriere."}</p>

              <div className="dates">
                <span className="meta">Start: {formatDate(p.startDate)}</span>
                <span className="meta">End: {formatDate(p.endDate)}</span>
              </div>

              <div className="card-bottom">
                {p.teamId ? (
                  <span className="meta">
                    Team: {teamById.get(String(p.teamId))?.name ?? `#${p.teamId}`}
                  </span>
                ) : (
                  <span className="meta">—</span>
                )}
                <span className="meta">ID: {p.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal (doar manager/admin) */}
      {isModalOpen && isManagerOrAdmin && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{mode === "create" ? "Proiect nou" : "Editează proiect"}</h3>
              <button className="icon-btn" onClick={closeModal} title="Close">
                ✖
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSave}>
              <label>
                Nume
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </label>

              <label>
                Descriere
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </label>

              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="row">
                <label>
                  Start date
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                  />
                </label>
              </div>

              <label>
                Team (opțional)
                <select
                  value={draft.teamId}
                  onChange={(e) => setDraft((d) => ({ ...d, teamId: e.target.value }))}
                  disabled={teamsLoading}
                >
                  <option value="">— Fără echipă —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              {error && <div className="error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
