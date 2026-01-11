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
      const res = await api.get("/users");
      const list = res?.data?.data ?? [];

      if (!Array.isArray(list) || list.length === 0) {
        setUser(null);
        setDraft(empty);
        setError("Nu există niciun utilizator în baza de date (creează unul).");
        return;
      }

      // 1) luăm id-ul memorat (dacă există)
      const savedId = localStorage.getItem("myUserId");

      // 2) încercăm să găsim user-ul salvat
      let me = savedId ? list.find((u) => String(u.id) === String(savedId)) : null;

      // 3) dacă nu există încă, alegem primul și îl memorăm
      if (!me) {
        me = list[0];
        localStorage.setItem("myUserId", String(me.id));
      }

      setUser(me);
      setDraft({
        username: me.username ?? "",
        email: me.email ?? "",
        phone: me.phone ?? "",
        role: me.role ?? "",
      });
    } catch (err) {
      console.error("Profile load error:", err);
      setError("Nu am putut încărca profilul.");
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
      setError("Nu am un user selectat.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.put(`/users/${user.id}`, {
        username: draft.username.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || null,
        role: draft.role || user.role,
      });

      const updated = res?.data?.data ?? user;
      setUser(updated);
      setSuccess("Profil salvat ✔");
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Nu am putut salva profilul.");
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
