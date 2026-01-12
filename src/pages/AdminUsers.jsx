import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/api";
import "./AdminUsers.css";

const emptyDraft = {
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "executor",
  managerId: "",
};

function normalizeRole(r) {
  const v = String(r || "").toLowerCase();
  if (v === "admin" || v === "manager" || v === "executor") return v;
  return "executor";
}

export default function AdminUsers() {
  const role = normalizeRole(localStorage.getItem("role"));
  const token = localStorage.getItem("token");
  const canAccess = token && role === "admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // filters
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);

  if (!canAccess) return <Navigate to="/login" replace />;

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users");
      const list = res?.data?.data ?? [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("AdminUsers fetch error:", err);
      setError("Nu am putut încărca utilizatorii.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    
  }, []);

  const managers = useMemo(
    () => users.filter((u) => normalizeRole(u.role) === "manager"),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      const okQuery =
        !q ||
        String(u.username || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q);

      const ur = normalizeRole(u.role);
      const okRole = roleFilter === "all" || ur === roleFilter;

      return okQuery && okRole;
    });
  }, [users, query, roleFilter]);

  function openCreate() {
    setMode("create");
    setActiveId(null);
    setDraft(emptyDraft);
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(u) {
    setMode("edit");
    setActiveId(u.id);
    setDraft({
      username: u.username ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      password: "", 
      role: normalizeRole(u.role),
      managerId: u.managerId ? String(u.managerId) : "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setActiveId(null);
    setDraft(emptyDraft);
  }

  function validate(d) {
    if (!d.username.trim()) return "Username este obligatoriu.";
    if (!d.email.trim() || !d.email.includes("@")) return "Email invalid.";
    if (mode === "create" && !d.password.trim()) return "Parola este obligatorie la creare.";
    if (normalizeRole(d.role) === "executor" && !d.managerId) {
      return "Executantul trebuie să aibă un manager alocat.";
    }
    return "";
  }

  async function handleSave(e) {
    e.preventDefault();

    const msg = validate(draft);
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError("");

    const payloadBase = {
      username: draft.username.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim() || null,
      role: normalizeRole(draft.role),
      managerId: normalizeRole(draft.role) === "executor" ? Number(draft.managerId) : null,
    };

    try {
      if (mode === "create") {
        const payload = { ...payloadBase, password: draft.password.trim() };
        await api.post("/users", payload);
      } else {
        const payload = draft.password.trim()
          ? { ...payloadBase, password: draft.password.trim() }
          : payloadBase;

        await api.put(`/users/${activeId}`, payload);
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error("AdminUsers save error:", err);
      setError(err?.response?.data?.message || "Nu am putut salva utilizatorul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u) {
    const ok = window.confirm(`Ștergi utilizatorul "${u.username}"?`);
    if (!ok) return;

    try {
      await api.delete(`/users/${u.id}`);
      await fetchUsers();
    } catch (err) {
      console.error("AdminUsers delete error:", err);
      alert("Nu am putut șterge utilizatorul.");
    }
  }

  return (
    <div className="admin-users">
      <div className="head">
        <div>
          <h2>Admin: Users</h2>
          <p className="sub">Creează manageri/executanți și setează manager pentru executanți.</p>
        </div>

        <div className="actions">
          <button className="btn" onClick={fetchUsers} disabled={loading}>
            Refresh
          </button>
          <button className="btn primary" onClick={openCreate}>
            + New user
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută după username/email..."
          />
        </div>

        <div className="filters">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Toate rolurile</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="executor">executor</option>
          </select>

          <button
            className="btn"
            onClick={() => {
              setQuery("");
              setRoleFilter("all");
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
          <h3>Niciun utilizator</h3>
          <p>Creează primul utilizator.</p>
          <button className="btn primary" onClick={openCreate}>
            Creează user
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid">
          {filtered.map((u) => (
            <div className="card" key={u.id}>
              <div className="top">
                <div>
                  <div className="title">{u.username}</div>
                  <div className="muted">{u.email}</div>
                </div>

                <div className="menu">
                  <button className="icon-btn" onClick={() => openEdit(u)} title="Edit">
                    ✏️
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(u)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>

              <div className="meta-row">
                <span className={`pill ${normalizeRole(u.role)}`}>{normalizeRole(u.role)}</span>
                <span className="chip">ID: {u.id}</span>
                {normalizeRole(u.role) === "executor" && (
                  <span className="chip">Manager: {u.managerId ?? "—"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{mode === "create" ? "User nou" : "Editează user"}</h3>
              <button className="icon-btn" onClick={closeModal} title="Close">
                ✖
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSave}>
              <div className="row">
                <label>
                  Username
                  <input
                    value={draft.username}
                    onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                  />
                </label>

                <label>
                  Email
                  <input
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </label>
              </div>

              <div className="row">
                <label>
                  Phone (optional)
                  <input
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  />
                </label>

                <label>
                  Role
                  <select
                    value={draft.role}
                    onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="executor">executor</option>
                  </select>
                </label>
              </div>

              {/* manager assignment doar pentru executor */}
              {normalizeRole(draft.role) === "executor" && (
                <label>
                  Manager
                  <select
                    value={draft.managerId}
                    onChange={(e) => setDraft((d) => ({ ...d, managerId: e.target.value }))}
                  >
                    <option value="">— Alege manager —</option>
                    {managers.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.username} (#{m.id})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Password {mode === "edit" ? "(optional)" : ""}
                <input
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                  placeholder={mode === "edit" ? "Lasă gol ca să nu schimbi parola" : "Parolă"}
                />
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

              {normalizeRole(draft.role) === "executor" && managers.length === 0 && (
                <div className="warn">
                  Nu există manageri în sistem. Creează întâi un manager, apoi poți crea executanți.
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
