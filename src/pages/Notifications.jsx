import { useEffect, useState } from "react";
import { api } from "../api/api";
import "./Notifications.css";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  async function fetchNotifications() {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setItems([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = {};
      if (onlyUnread) params.unread = "true";

      const res = await api.get("/notifications", { params });
      const list = res?.data?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Eroare notifications:", err);
      setError("Nu am putut încărca notificările.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnread]);

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error("Eroare mark read:", err);
      alert("Nu am putut marca notificarea ca citită.");
    }
  }

  async function markAllRead() {
    try {
      await api.put("/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Eroare mark all read:", err);
      alert("Nu am putut marca toate ca citite.");
    }
  }

  async function remove(id) {
    const ok = window.confirm("Ștergi notificarea?");
    if (!ok) return;

    try {
      await api.delete(`/notifications/${id}`);
      await fetchNotifications();
    } catch (err) {
      console.error("Eroare delete:", err);
      alert("Nu am putut șterge notificarea.");
    }
  }

  function typeBadge(type) {
    const t = String(type || "info").toLowerCase(); // TASK -> "task"
    return `nbadge ${t}`;
  }

  function titleFor(n) {
    // dacă backend-ul nu are "title", construim unul ok
    // ex: "TASK" / "PROJECT" + mesaj
    const t = String(n.type || "").toUpperCase();
    if (n.title) return n.title;

    if (t === "TASK") return "Task update";
    if (t === "PROJECT") return "Project update";
    return "Notification";
  }

  return (
    <div className="not-page">
      <div className="not-head">
        <div>
          <h2>Notifications</h2>
          <p className="sub">Vezi și gestionează notificările aplicației.</p>
        </div>

        <div className="actions">
          <button className="btn" onClick={fetchNotifications} disabled={loading}>
            Refresh
          </button>

          <button className="btn" onClick={markAllRead} disabled={loading || items.length === 0}>
            Mark all read
          </button>

          <button
            className="btn primary"
            onClick={() => setOnlyUnread((v) => !v)}
            disabled={loading}
          >
            {onlyUnread ? "Show all" : "Only unread"}
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

      {!loading && !error && items.length === 0 && (
        <div className="empty">
          <h3>Nicio notificare</h3>
          <p>Momentan nu ai notificări.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="not-list">
          {items.map((n) => (
            <div key={n.id} className={`not-card ${n.isRead ? "read" : "unread"}`}>
              <div className="top">
                <div className="left">
                  <div className="title-row">
                    <h3 className="title">{titleFor(n)}</h3>
                    <span className={typeBadge(n.type)}>{String(n.type || "info")}</span>
                    {!n.isRead && <span className="dot" title="Unread" />}
                  </div>

                  <p className="msg">{n.message || "—"}</p>

                  {/* bonus: info contextuală dacă există */}
                  <div className="mini-meta">
                    {n.projectId ? <span className="chip">Project #{n.projectId}</span> : null}
                    {n.taskId ? <span className="chip">Task #{n.taskId}</span> : null}
                    {n.fromUserId ? <span className="chip">From #{n.fromUserId}</span> : null}
                  </div>
                </div>

                <div className="menu">
                  {!n.isRead && (
                    <button className="icon-btn" onClick={() => markRead(n.id)} title="Mark read">
                      ✓
                    </button>
                  )}
                  <button className="icon-btn danger" onClick={() => remove(n.id)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>

              <div className="meta">
                {n.createdAt ? new Date(n.createdAt).toLocaleString("ro-RO") : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
