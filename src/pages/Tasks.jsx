import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import "./Tasks.css";

const STATUS_UI_ALL = [
  { value: "all", label: "Status" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_UI_EXECUTOR = [
  { value: "all", label: "Status" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
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
  return "pill status todo";
}

function prioPill(priority) {
  const p = String(priority || "MEDIUM").toUpperCase();
  return `pill prio ${p.toLowerCase()}`;
}

function normalizeRole(r) {
  const v = String(r || "").toLowerCase();
  if (v === "admin" || v === "manager" || v === "executor") return v;
  return "";
}

function normalizeTaskStatus(s) {
  const v = String(s || "OPEN").toUpperCase();
  if (["OPEN", "PENDING", "COMPLETED", "CLOSED"].includes(v)) return v;
  return "OPEN";
}

function normalizePriority(p) {
  const v = String(p || "MEDIUM").toUpperCase();
  if (["LOW", "MEDIUM", "HIGH", "URGENT"].includes(v)) return v;
  return "MEDIUM";
}

// încearcă mai multe nume posibile (în funcție de backend)
function getAssignedId(t) {
  return (
    t?.userId ??
    t?.executorId ??
    t?.assignedTo ??
    t?.assignedUserId ??
    t?.assigneeId ??
    null
  );
}

export default function Tasks() {
  const token = localStorage.getItem("token");
  const role = normalizeRole(localStorage.getItem("role"));

  const isExecutor = role === "executor";
  const isManagerOrAdmin = role === "manager" || role === "admin";

  const STATUS_UI = isExecutor ? STATUS_UI_EXECUTOR : STATUS_UI_ALL;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // ✅ executor filter (manager/admin)
  const [executorFilter, setExecutorFilter] = useState("all"); // "all" | "<id>"

  // modal create (doar manager/admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  // teams dropdown
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // executors dropdown (pentru assign + filtrare)
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

  async function fetchExecutors() {
    if (!token) return;
    if (!isManagerOrAdmin) return;

    setUsersLoading(true);
    try {
      // ✅ IMPORTANT:
      // /users este admin-only la tine, deci manager nu vede lista.
      // Folosește endpoint-ul dedicat: GET /api/users/executors (admin + manager).
      const res = await api.get("/users/executors");
      const items = res?.data?.data ?? [];
      const list = Array.isArray(items) ? items : [];

      // backend-ul deja filtrează executorii, dar păstrăm un guard
      const execs = list.filter((u) => normalizeRole(u.role) === "executor");
      setExecutors(execs);
    } catch (err) {
      console.error("Eroare la preluare executors:", err);
      setExecutors([]); // ca să nu rămână stale
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchTasks() {
    if (!token) {
      setLoading(false);
      setTasks([]);
      return;
    }

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

      const st = normalizeTaskStatus(t.status);
      const pr = normalizePriority(t.priority);

      const okStatus = statusFilter === "all" || st === statusFilter;
      const okPrio = priorityFilter === "all" || pr === priorityFilter;

      // ✅ filter by executor (manager/admin)
      const assignedId = getAssignedId(t);
      const okExecutor =
        !isManagerOrAdmin ||
        executorFilter === "all" ||
        String(assignedId ?? "") === String(executorFilter);

      return okQuery && okStatus && okPrio && okExecutor;
    });
  }, [tasks, query, statusFilter, priorityFilter, executorFilter, isManagerOrAdmin]);

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
    if (d.description.trim().length < 3) return "Descrierea trebuie să aibă minim 3 caractere.";
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

    const payload = {
      description: draft.description.trim(),
      priority: normalizePriority(draft.priority),
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
      setError(err?.response?.data?.message || "Nu am putut crea task-ul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t) {
    if (!isManagerOrAdmin) return;

    const ok = window.confirm("Ștergi task-ul?");
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
      alert(err?.response?.data?.message || "Nu am putut aloca task-ul.");
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
          <button className="btn" onClick={fetchTasks} disabled={loading || !token}>
            Refresh
          </button>

          {isManagerOrAdmin && (
            <button className="btn primary" onClick={openCreate} disabled={!token}>
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

          {/* ✅ executor dropdown filter (manager/admin) */}
          {isManagerOrAdmin && (
            <select
              value={executorFilter}
              onChange={(e) => setExecutorFilter(e.target.value)}
              disabled={usersLoading}
              title="Filtrează după executant"
            >
              <option value="all">Executant</option>
              {executors.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.username} ({u.email})
                </option>
              ))}
            </select>
          )}

          <button
            className="btn"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setExecutorFilter("all");
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
            const st = normalizeTaskStatus(t.status);

            const canAssign = isManagerOrAdmin && st === "OPEN";
            const canComplete = isExecutor && st === "PENDING";
            const canClose = isManagerOrAdmin && st === "COMPLETED";

            const assignedId = getAssignedId(t);

            return (
              <div key={t.id} className="task-card">
                <div className="top">
                  <div className="title-wrap">
                    <h3 className="title">{t.description}</h3>

                    <div className="pills">
                      <span className={statusPill(st)}>{st}</span>
                      <span className={prioPill(t.priority)}>{normalizePriority(t.priority)}</span>
                    </div>
                  </div>

                  <div className="menu">
                    {canComplete && (
                      <button className="icon-btn" onClick={() => handleComplete(t)} title="Complete">
                        ✅
                      </button>
                    )}

                    {canClose && (
                      <button className="icon-btn" onClick={() => handleClose(t)} title="Close">
                        🔒
                      </button>
                    )}

                    {isManagerOrAdmin && (
                      <button className="icon-btn danger" onClick={() => handleDelete(t)} title="Delete">
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Assign UI (manager/admin, doar când OPEN) */}
                {canAssign && (
                  <div className="assign-row">
                    <select
                      value={assignToByTask[t.id] ?? ""}
                      onChange={(e) => setAssignToByTask((m) => ({ ...m, [t.id]: e.target.value }))}
                      disabled={usersLoading}
                      className="assign-select"
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
                    Team: {t.teamId ? teamById.get(String(t.teamId))?.name ?? `#${t.teamId}` : "—"}
                  </span>

                  <span className="meta">Due: {formatDate(t.dueDate)}</span>

                  {!isExecutor && (
                    <span className="meta">
                      Assigned:{" "}
                      {assignedId
                        ? executorById.get(String(assignedId))?.username ??
                          executorById.get(String(assignedId))?.email ??
                          `#${assignedId}`
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
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Ex: Creează pagina Teams"
                />
              </label>

              <div className="row">
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

                <label>
                  Due date
                  <input
                    type="date"
                    value={draft.dueDate}
                    onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                  />
                </label>
              </div>

              <div className="row">
                <label>
                  Project ID (opțional)
                  <input
                    value={draft.projectId}
                    onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}
                    placeholder="Ex: 1"
                  />
                </label>

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
              </div>

              {error && <div className="error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
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
