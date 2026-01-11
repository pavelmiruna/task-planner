import { useEffect, useState } from "react";
import { api } from "../api/api";
import "./Notifications.css";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  async function fetchNotifications() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (onlyUnread) params.unread = "true";

      const res = await api.get("/notifications", { params }); // dacă baseURL include /api
      setItems(res?.data?.data ?? []);
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
      fetchNotifications();
    } catch (err) {
      console.error("Eroare mark read:", err);
      alert("Nu am putut marca notificarea ca citită.");
    }
  }

  async function markAllRead() {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
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
      fetchNotifications();
    } catch (err) {
      console.error("Eroare delete:", err);
      alert("Nu am putut șterge notificarea.");
    }
  }

  function typeBadge(type) {
    const t = String(type || "info").toLowerCase();
    return `nbadge ${t}`;
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
          <button className="btn" onClick={markAllRead} disabled={loading}>
            Mark all read
          </button>
          <button className="btn primary" onClick={() => setOnlyUnread((v) => !v)}>
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
                    <h3 className="title">{n.title}</h3>
                    <span className={typeBadge(n.type)}>{String(n.type || "info")}</span>
                    {!n.isRead && <span className="dot" title="Unread" />}
                  </div>
                  <p className="msg">{n.message || "—"}</p>
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
