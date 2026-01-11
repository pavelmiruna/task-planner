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
  return `pill prio ${p.toLowerCase()}`;
}

export default function Tasks() {
  // role
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isExecutor = role === "executor";
  const isManagerOrAdmin = role === "manager" || role === "admin";

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // modal create (doar manager/admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  // teams dropdown
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // executors dropdown (pentru assign)
  const [executors, setExecutors] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // assign selection per taskId
  const [assignToByTask, setAssignToByTask] = useState({}); // { [taskId]: executorId }

  const teamById = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [teams]);

  const executorById = useMemo(() => {
    const map = new Map();
    executors.forEach((u) => map.set(String(u.id), u));
    return map;
  }, [executors]);

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

  async function fetchExecutors() {
    // doar manager/admin are nevoie de asta (pentru assign)
    if (!isManagerOrAdmin) return;

    setUsersLoading(true);
    try {
      const res = await api.get("/users");
      const items = res?.data?.data ?? [];
      const list = Array.isArray(items) ? items : [];

      const execs = list.filter(
        (u) => String(u.role || "").toLowerCase() === "executor"
      );
      setExecutors(execs);
    } catch (err) {
      console.error("Eroare la preluare users/executors:", err);
      // nu blocăm pagina dacă nu merge users
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchTasks() {
    setLoading(true);
    setError("");

    try {
      const url = isExecutor ? "/tasks/my" : "/tasks";
      const res = await api.get(url);
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
    fetchExecutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tasks.filter((t) => {
      const desc = (t.description ?? "").toLowerCase();

      const okQuery = !q || desc.includes(q);

      const st = String(t.status ?? "OPEN").toUpperCase();
      const pr = String(t.priority ?? "MEDIUM").toUpperCase();

      const okStatus = statusFilter === "all" || st === statusFilter;
      const okPrio = priorityFilter === "all" || pr === priorityFilter;

      return okQuery && okStatus && okPrio;
    });
  }, [tasks, query, statusFilter, priorityFilter]);

  function openCreate() {
    if (!isManagerOrAdmin) return;
    setDraft(emptyDraft);
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setDraft(emptyDraft);
  }

  function validateCreate(d) {
    if (!d.description.trim()) return "Completează descrierea task-ului.";
    if (d.description.trim().length < 3)
      return "Descrierea trebuie să aibă minim 3 caractere.";
    if (!d.priority) return "Alege o prioritate.";
    return "";
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!isManagerOrAdmin) return;

    const msg = validateCreate(draft);
    if (msg) return setError(msg);

    setSaving(true);
    setError("");

    // backend-ul impune OPEN și ignoră userId/status la create
    const payload = {
      description: draft.description.trim(),
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      projectId: draft.projectId ? Number(draft.projectId) : null,
      teamId: draft.teamId ? Number(draft.teamId) : null,
    };

    try {
      await api.post("/tasks", payload);
      await fetchTasks();
      closeModal();
    } catch (err) {
      console.error("Eroare la creare task:", err);
      setError("Nu am putut crea task-ul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t) {
    if (!isManagerOrAdmin) return;

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

  async function handleComplete(t) {
    if (!isExecutor) return;

    try {
      await api.put(`/tasks/${t.id}/complete`);
      await fetchTasks();
    } catch (err) {
      console.error("Eroare complete:", err);
      alert("Nu am putut marca task-ul ca realizat.");
    }
  }

  async function handleClose(t) {
    if (!isManagerOrAdmin) return;

    try {
      await api.put(`/tasks/${t.id}/close`);
      await fetchTasks();
    } catch (err) {
      console.error("Eroare close:", err);
      alert("Nu am putut închide task-ul.");
    }
  }

  async function handleAssign(t) {
    if (!isManagerOrAdmin) return;

    const selected = assignToByTask[t.id];
    const executorId = Number(selected);

    if (!executorId) {
      alert("Alege un executant înainte de Assign.");
      return;
    }

    try {
      await api.put(`/tasks/${t.id}/assign`, { userId: executorId });
      await fetchTasks();
    } catch (err) {
      console.error("Eroare assign:", err);
      alert("Nu am putut aloca task-ul.");
    }
  }

  return (
    <div className="tasks-page">
      <div className="tasks-head">
        <div>
          <h2>Tasks</h2>
          <p className="sub">
            {isExecutor
              ? "Vezi task-urile tale și marchează-le ca realizate."
              : "Caută, filtrează și gestionează task-urile."}
          </p>
        </div>

        <div className="actions">
          <button className="btn" onClick={fetchTasks} disabled={loading}>
            Refresh
          </button>

          {isManagerOrAdmin && (
            <button className="btn primary" onClick={openCreate}>
              + New task
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută în descriere..."
          />
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_UI.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
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
          <p>{isManagerOrAdmin ? "Creează primul task." : "Nu ai task-uri încă."}</p>

          {isManagerOrAdmin && (
            <button className="btn primary" onClick={openCreate}>
              Creează task
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid">
          {filtered.map((t) => {
            const st = String(t.status ?? "OPEN").toUpperCase();
            const canComplete = isExecutor && st === "PENDING";
            const canClose = isManagerOrAdmin && st === "COMPLETED";
            const canAssign = isManagerOrAdmin && st === "OPEN";

            return (
              <div key={t.id} className="task-card">
                <div className="top">
                  <div className="title-wrap">
                    <h3 className="title">{t.description}</h3>

                    <div className="pills">
                      <span className={statusPill(t.status)}>
                        {String(t.status ?? "OPEN")}
                      </span>
                      <span className={prioPill(t.priority)}>
                        {String(t.priority ?? "MEDIUM")}
                      </span>
                    </div>
                  </div>

                  <div className="menu">
                    {canComplete && (
                      <button
                        className="icon-btn"
                        onClick={() => handleComplete(t)}
                        title="Complete"
                      >
                        ✅
                      </button>
                    )}

                    {canClose && (
                      <button
                        className="icon-btn"
                        onClick={() => handleClose(t)}
                        title="Close"
                      >
                        🔒
                      </button>
                    )}

                    {isManagerOrAdmin && (
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDelete(t)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Assign UI (manager/admin, doar când OPEN) */}
                {canAssign && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      value={assignToByTask[t.id] ?? ""}
                      onChange={(e) =>
                        setAssignToByTask((m) => ({ ...m, [t.id]: e.target.value }))
                      }
                      disabled={usersLoading}
                      style={{ flex: 1 }}
                    >
                      <option value="">— Alege executant —</option>
                      {executors.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.username} ({u.email})
                        </option>
                      ))}
                    </select>

                    <button className="btn" onClick={() => handleAssign(t)} disabled={usersLoading}>
                      Assign
                    </button>
                  </div>
                )}

                <div className="bottom">
                  <span className="meta">Project: {t.projectId ?? "—"}</span>

                  <span className="meta">
                    Team:{" "}
                    {t.teamId
                      ? teamById.get(String(t.teamId))?.name ?? `#${t.teamId}`
                      : "—"}
                  </span>

                  <span className="meta">Due: {formatDate(t.dueDate)}</span>

                  {/* Info extra: cine e assignat */}
                  {!isExecutor && (
                    <span className="meta">
                      Assigned:{" "}
                      {t.userId
                        ? executorById.get(String(t.userId))?.username ?? `#${t.userId}`
                        : "—"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create (doar manager/admin) */}
      {isModalOpen && isManagerOrAdmin && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Task nou</h3>
              <button className="icon-btn" onClick={closeModal} title="Close">
                ✖
              </button>
            </div>

            <form className="modal-body" onSubmit={handleCreate}>
              <label>
                Task (descriere)
                <input
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Ex: Creează pagina Teams"
                />
              </label>

              <div className="row">
                <label>
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, priority: e.target.value }))
                    }
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    value={draft.dueDate}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, dueDate: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="row">
                <label>
                  Project ID (opțional)
                  <input
                    value={draft.projectId}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, projectId: e.target.value }))
                    }
                    placeholder="Ex: 1"
                  />
                </label>

                <label>
                  Team (opțional)
                  <select
                    value={draft.teamId}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, teamId: e.target.value }))
                    }
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
              </div>

              {error && <div className="error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>

              <p style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                * Status-ul este setat automat la <b>OPEN</b> la creare.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
