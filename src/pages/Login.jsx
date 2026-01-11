import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = emailOrUsername.includes("@")
        ? { email: emailOrUsername, password }
        : { username: emailOrUsername, password };

      const res = await api.post("/auth/login", payload);
      localStorage.setItem("token", res.data.token);

      const me = await api.get("/auth/me");
      const role = me.data.user.role;

      localStorage.setItem("role", role);
      localStorage.setItem("userId", String(me.data.user.id));

      if (role === "admin") navigate("/admin/users");
      else if (role === "manager") navigate("/manager/tasks");
      else navigate("/my-tasks");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
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
            />
          </label>

          <button className="login-btn" type="submit">
            Login
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
