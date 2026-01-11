import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import "./Tasks.css";

const STATUS_UI = [
  { value: "all", label: "Status" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITY_UI = [
  { value: "all", label: "Prioritate" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const emptyDraft = {
  description: "",
  status: "OPEN",
  priority: "MEDIUM",
  dueDate: "",
  projectId: "",
  teamId: "",
};

function toDateInputValue(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ro-RO");
}

function statusPill(status) {
  const s = String(status || "OPEN").toUpperCase();
  if (s === "COMPLETED") return "pill status done";
  if (s === "CLOSED") return "pill status paused";
  if (s === "PENDING") return "pill status doing";
  return "pill status todo"; // OPEN
}

function prioPill(priority) {
  const p = String(priority || "MEDIUM").toUpperCase();
  return `pill prio ${p.toLowerCase()}`; // ca să poți stiliza în css: .prio.urgent etc
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  // teams dropdown
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const teamById = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [teams]);

  async function fetchTeams() {
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

  async function fetchTasks() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter; // OPEN, PENDING...
      if (priorityFilter !== "all") params.priority = priorityFilter; // LOW, MEDIUM...

      const res = await api.get("/tasks", { params });
      const items = res?.data?.data ?? [];
      setTasks(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Eroare la preluare tasks:", err);
      setError("Nu am putut încărca task-urile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;

    return tasks.filter((t) => {
      const desc = (t.description ?? "").toLowerCase();
      return desc.includes(q);
    });
  }, [tasks, query]);

  function openCreate() {
    setMode("create");
    setActiveId(null);
    setDraft(emptyDraft);
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(t) {
    setMode("edit");
    setActiveId(t.id);
    setDraft({
      description: t.description ?? "",
      status: String(t.status ?? "OPEN").toUpperCase(),
      priority: String(t.priority ?? "MEDIUM").toUpperCase(),
      dueDate: toDateInputValue(t.dueDate),
      projectId: t.projectId ? String(t.projectId) : "",
      teamId: t.teamId ? String(t.teamId) : "",
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

  function validate(d) {
    if (!d.description.trim()) return "Completează descrierea task-ului.";
    if (d.description.trim().length < 3) return "Descrierea trebuie să aibă minim 3 caractere.";
    if (!d.status) return "Alege un status.";
    if (!d.priority) return "Alege o prioritate.";
    return "";
  }

  async function handleSave(e) {
    e.preventDefault();

    const msg = validate(draft);
    if (msg) return setError(msg);

    setSaving(true);
    setError("");

    const payload = {
      description: draft.description.trim(),
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || null, // DATE în backend (merge cu string ISO)
      projectId: draft.projectId ? Number(draft.projectId) : null,
      teamId: draft.teamId ? Number(draft.teamId) : null,
    };

    try {
      if (mode === "create") {
        await api.post("/tasks", payload);
      } else {
        await api.put(`/tasks/${activeId}`, payload);
      }
      await fetchTasks();
      closeModal();
    } catch (err) {
      console.error("Eroare la salvare task:", err);
      setError("Nu am putut salva task-ul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t) {
    const ok = window.confirm(`Ștergi task-ul?`);
    if (!ok) return;

    try {
      await api.delete(`/tasks/${t.id}`);
      await fetchTasks();
    } catch (err) {
      console.error("Eroare la ștergere task:", err);
      alert("Nu am putut șterge task-ul.");
    }
  }

  async function quickToggleDone(t) {
    const current = String(t.status ?? "OPEN").toUpperCase();
    const nextStatus = current === "COMPLETED" ? "OPEN" : "COMPLETED";

    try {
      await api.put(`/tasks/${t.id}`, { status: nextStatus });
      await fetchTasks();
    } catch (err) {
      console.error("Eroare toggle done:", err);
      alert("Nu am putut schimba statusul.");
    }
  }

  return (
    <div className="tasks-page">
      <div className="tasks-head">
        <div>
          <h2>Tasks</h2>
          <p className="sub">Caută, filtrează și gestionează task-urile.</p>
        </div>

        <div className="actions">
          <button className="btn" onClick={fetchTasks} disabled={loading}>
            Refresh
          </button>
          <button className="btn primary" onClick={openCreate}>
            + New task
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută în descriere..."
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_UI.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          {PRIORITY_UI.map((o) => (
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
            setPriorityFilter("all");
          }}
        >
          Reset
        </button>
      </div>

      {loading && (
        <div className="state">
          <div className="spinner" />
          <p>Se încarcă...</p>
        </div>
      )}

      {!loading && error && <div className="error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty">
          <h3>Niciun task</h3>
          <p>Creează primul task.</p>
          <button className="btn primary" onClick={openCreate}>
            Creează task
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid">
          {filtered.map((t) => (
            <div key={t.id} className="task-card">
              <div className="top">
                <div className="title-wrap">
                  {/* backend: description */}
                  <h3 className="title">{t.description}</h3>

                  <div className="pills">
                    <span className={statusPill(t.status)}>{String(t.status ?? "OPEN")}</span>
                    <span className={prioPill(t.priority)}>{String(t.priority ?? "MEDIUM")}</span>
                  </div>
                </div>

                <div className="menu">
                  <button className="icon-btn" onClick={() => quickToggleDone(t)} title="Toggle completed">
                    ✅
                  </button>
                  <button className="icon-btn" onClick={() => openEdit(t)} title="Edit">
                    ✏️
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(t)} title="Delete">
                    🗑️
                  </button>
                </div>
            </div>

              <div className="bottom">
                <span className="meta">Project: {t.projectId ?? "—"}</span>

                <span className="meta">
                  Team: {t.teamId ? teamById.get(String(t.teamId))?.name ?? `#${t.teamId}` : "—"}
                </span>

                <span className="meta">Due: {formatDate(t.dueDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{mode === "create" ? "Task nou" : "Editează task"}</h3>
              <button className="icon-btn" onClick={closeModal} title="Close">
                ✖
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSave}>
              <label>
                Task (descriere)
                <input
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Ex: Creează pagina Teams"
                />
              </label>

              <div className="row">
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </label>
              </div>

              <div className="row">
                <label>
                  Due date
                  <input
                    type="date"
                    value={draft.dueDate}
                    onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                  />
                </label>

                <label>
                  Project ID (opțional)
                  <input
                    value={draft.projectId}
                    onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}
                    placeholder="Ex: 1"
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
