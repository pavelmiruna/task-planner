import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/api";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [ok, setOk] = useState(null); // null=loading

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setOk(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        // ATENȚIE: la tine /auth/me răspunde cu { data: { ... } }
        const me = res?.data?.data;

        if (!me?.id) {
          setOk(false);
          return;
        }

        localStorage.setItem("userId", String(me.id));
        localStorage.setItem("role", String(me.role || "").toLowerCase());

        setOk(true);
      })
      .catch(() => {
        // interceptorul de 401 din api.js va face redirect
        setOk(false);
      });
  }, []);

  if (ok === null) return null; // sau un loader simplu
  if (!ok) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}
