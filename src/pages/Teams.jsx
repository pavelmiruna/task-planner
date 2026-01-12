import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import "./Teams.css";

const emptyDraft = { name: "", description: "", memberIds: [] };

export default function Teams() {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const canManageTeams = role === "admin" || role === "manager";

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); 
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  async function fetchTeams() {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setTeams([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/teams");
      const items = res?.data?.data ?? [];
      setTeams(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Eroare la preluare echipe:", err);
      setError("Nu am putut încărca echipele.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    if (!canManageTeams) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setUsersLoading(true);
    try {
      const res = await api.get("/users");
      const items = res?.data?.data ?? [];
      setUsers(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Eroare la preluare users:", err);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => {
      const name = (t.name ?? "").toLowerCase();
      const desc = (t.description ?? "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [teams, query]);

  const userById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(String(u.id), u));
    return map;
  }, [users]);

  function openCreate() {
    if (!canManageTeams) return;
    setMode("create");
    setActiveId(null);
    setDraft(emptyDraft);
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(team) {
    if (!canManageTeams) return;

    setMode("edit");
    setActiveId(team.id);

    const memberIds = Array.isArray(team.members)
      ? team.members.map((m) => String(m.id))
      : [];

    setDraft({
      name: team.name ?? "",
      description: team.description ?? "",
      memberIds,
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
    if (!d.name.trim()) return "Completează numele echipei.";
    if (d.name.trim().length < 2) return "Numele echipei trebuie să aibă minim 2 caractere.";
    return "";
  }

  function toggleMember(userId) {
    setDraft((d) => {
      const id = String(userId);
      const set = new Set((d.memberIds ?? []).map(String));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...d, memberIds: Array.from(set) };
    });
  }

  function clearMembers() {
    setDraft((d) => ({ ...d, memberIds: [] }));
  }

  async function saveMembers(teamId, memberIds) {
    if (!canManageTeams) return;

    const userIds = (memberIds ?? [])
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

    await api.put(`/teams/${teamId}/members`, { userIds });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!canManageTeams) return;

    const msg = validate(draft);
    if (msg) return setError(msg);

    setSaving(true);
    setError("");

    try {
      if (mode === "create") {
        // 1) create team
        const res = await api.post("/teams", {
          name: draft.name.trim(),
          description: draft.description.trim(),
        });

        const created = res?.data?.data;
        const newId = created?.id;

        // 2) setam members
        if (newId) {
          await saveMembers(newId, draft.memberIds);
        }
      } else {
        // 1) update team
        await api.put(`/teams/${activeId}`, {
          name: draft.name.trim(),
          description: draft.description.trim(),
        });

        // 2) set members
        await saveMembers(activeId, draft.memberIds);
      }

      await fetchTeams();
      closeModal();
    } catch (err) {
      console.error("Eroare la salvare team:", err);
      setError("Nu am putut salva echipa sau membrii.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(team) {
    if (!canManageTeams) return;

    const ok = window.confirm(`Ștergi echipa "${team.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/teams/${team.id}`);
      await fetchTeams();
    } catch (err) {
      console.error("Eroare la ștergere team:", err);
      alert("Nu am putut șterge echipa.");
    }
  }

  return (
    <div className="teams-page">
      <div className="teams-head">
        <div>
          <h2>Teams</h2>
          <p className="sub">
            {canManageTeams
              ? "Gestionează echipele: adaugă, editează, șterge."
              : "Vizualizează echipele."}
          </p>
        </div>

        <div className="actions">
          <button className="btn" onClick={fetchTeams} disabled={loading}>
            Refresh
          </button>

          {canManageTeams && (
            <button className="btn primary" onClick={openCreate}>
              + New team
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută echipă..."
          />
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
          <h3>Nicio echipă</h3>
          <p>{canManageTeams ? "Creează prima echipă." : "Nu există echipe."}</p>

          {canManageTeams && (
            <button className="btn primary" onClick={openCreate}>
              Creează echipă
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid">
          {filtered.map((t) => (
            <div key={t.id} className="team-card">
              <div className="top">
                <h3>{t.name}</h3>

                {canManageTeams && (
                  <div className="menu">
                    <button className="icon-btn" onClick={() => openEdit(t)} title="Edit">
                      ✏️
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(t)} title="Delete">
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <p className="desc">{t.description || "Fără descriere."}</p>

              {/* members preview */}
              <div className="members">
                <div className="members-label">Members:</div>
                <div className="members-list">
                  {(t.members?.length ? t.members : []).slice(0, 5).map((m) => (
                    <span key={m.id} className="member-pill">
                      {m.username ?? m.email ?? `User #${m.id}`}
                    </span>
                  ))}
                  {t.members?.length > 5 && (
                    <span className="member-more">+{t.members.length - 5}</span>
                  )}
                  {!t.members?.length && <span className="member-empty">—</span>}
                </div>
              </div>

              <div className="meta">ID: {t.id}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pt admin/manager */}
      {isModalOpen && canManageTeams && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{mode === "create" ? "Echipă nouă" : "Editează echipa"}</h3>
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
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </label>

              {/* Members selector */}
              <div className="members-box">
                <div className="members-box-head">
                  <div>
                    <div className="members-title">Membrii echipei</div>
                    <div className="members-hint">
                      Bifează userii pe care vrei să îi adaugi.
                    </div>
                  </div>

                  <button type="button" className="btn" onClick={clearMembers} disabled={saving}>
                    Clear
                  </button>
                </div>

                {usersLoading ? (
                  <div className="members-loading">Se încarcă lista de users…</div>
                ) : users.length === 0 ? (
                  <div className="members-loading">Nu există users în sistem.</div>
                ) : (
                  <div className="members-grid">
                    {users.map((u) => {
                      const id = String(u.id);
                      const checked = (draft.memberIds ?? []).includes(id);

                      return (
                        <label key={u.id} className={`member-row ${checked ? "checked" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(id)}
                          />
                          <span className="member-text">
                            <span className="member-username">{u.username}</span>
                            <span className="member-email">{u.email}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Selected preview */}
                <div className="selected">
                  <div className="members-label">Selectați:</div>
                  <div className="members-list">
                    {(draft.memberIds ?? []).length ? (
                      (draft.memberIds ?? []).map((id) => {
                        const u = userById.get(String(id));
                        return (
                          <span key={id} className="member-pill">
                            {u?.username ?? u?.email ?? `User #${id}`}
                          </span>
                        );
                      })
                    ) : (
                      <span className="member-empty">—</span>
                    )}
                  </div>
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              {!canManageTeams && (
                <div className="error" style={{ marginTop: 10 }}>
                  Nu ai drepturi să editezi echipe.
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
