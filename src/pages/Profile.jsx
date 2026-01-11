import { useEffect, useState } from "react";
import { api } from "../api/api";
import "./Profile.css";

const empty = { username: "", email: "", phone: "", role: "" };

export default function Profile() {
  const [user, setUser] = useState(null);
  const [draft, setDraft] = useState(empty);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ✅ ia user-ul logat din token
      const res = await api.get("/auth/me");
      const me = res?.data?.data;

      if (!me?.id) {
        setUser(null);
        setDraft(empty);
        setError("Nu am putut identifica utilizatorul logat.");
        return;
      }

      // ✅ ținem userId/role sincron (optional, dar util)
      localStorage.setItem("userId", String(me.id));
      localStorage.setItem("role", String(me.role || "").toLowerCase());

      setUser(me);
      setDraft({
        username: me.username ?? "",
        email: me.email ?? "",
        phone: me.phone ?? "",
        role: me.role ?? "",
      });
    } catch (err) {
      console.error("Profile load error:", err);
      setUser(null);
      setDraft(empty);

      // dacă token e invalid, interceptorul din api.js te duce la /login
      setError("Nu am putut identifica utilizatorul logat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function validate(d) {
    if (!d.username.trim()) return "Username este obligatoriu.";
    if (!d.email.trim()) return "Email-ul este obligatoriu.";
    if (!d.email.includes("@")) return "Email invalid.";
    return "";
  }

  async function save(e) {
    e.preventDefault();

    const msg = validate(draft);
    if (msg) {
      setSuccess("");
      setError(msg);
      return;
    }

    if (!user?.id) {
      setError("Nu am putut identifica utilizatorul logat.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // ✅ update pe /users/:id (backend-ul tău are ruta asta)
      const res = await api.put(`/users/${user.id}`, {
        username: draft.username.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || null,
        // role NU îl schimbăm din UI
      });

      const updated = res?.data?.data;
      const merged = updated
        ? { ...user, ...updated }
        : { ...user, ...draft };

      setUser(merged);
      setSuccess("Profil salvat ✔");
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err?.response?.data?.message || "Nu am putut salva profilul.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-head">
        <div>
          <h2>My Profile</h2>
          <p className="sub">Actualizează datele profilului.</p>
        </div>

        <button className="btn" onClick={loadProfile} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="state">
          <div className="spinner" />
          <p>Se încarcă...</p>
        </div>
      )}

      {!loading && error && <div className="error">{error}</div>}
      {!loading && success && <div className="success">{success}</div>}

      {!loading && !error && user && (
        <div className="profile-grid">
          <section className="card">
            <div className="avatar">{(user?.username?.[0] || "U").toUpperCase()}</div>
            <div className="who">
              <div className="name">{user.username}</div>
              <div className="meta">{user.email}</div>
            </div>

            <div className="mini">
              <div className="mini-item">
                <span className="k">Phone</span>
                <span className="v">{user.phone || "—"}</span>
              </div>
              <div className="mini-item">
                <span className="k">Role</span>
                <span className="v">{user.role || "—"}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3>Edit profile</h3>

            <form className="form" onSubmit={save}>
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

              <label>
                Phone (optional)
                <input
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                />
              </label>

              <label>
                Role
                <input value={draft.role} disabled />
              </label>

              <div className="actions">
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
