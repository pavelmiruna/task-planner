import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = emailOrUsername.includes("@")
        ? { email: emailOrUsername.trim(), password }
        : { username: emailOrUsername.trim(), password };

      // login
      const res = await api.post("/auth/login", payload);
      const token = res?.data?.data?.token;

      if (!token) {
        throw new Error("Token missing from /auth/login response");
      }

      localStorage.setItem("token", token);

      // me 
      const meRes = await api.get("/auth/me");
      const me = meRes?.data?.data;

      const role = String(me?.role || "").toLowerCase();
      const userId = me?.id;

      localStorage.setItem("role", role);
      localStorage.setItem("userId", String(userId || ""));

      // pagina protejata-> inapoi acolo
      const from = location.state?.from?.pathname;


      if (from && from !== "/login") {
        navigate(from, { replace: true });
        return;
      }

      // redirect 
      if (role === "admin") navigate("/admin/users", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";
      setError(msg);

      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        <p className="login-sub">Autentifică-te pentru a continua.</p>

        <form className="login-form" onSubmit={handleLogin}>
          <label>
            Email sau username
            <input
              className="login-input"
              placeholder="ex: andrei@test.com"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label>
            Parolă
            <input
              className="login-input"
              placeholder="••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>

        <p className="login-hint">
          Demo (seed): andrei@test.com / 1234, mihai@test.com / 1234, ana@test.com / 1234
        </p>
      </div>
    </div>
  );
}
