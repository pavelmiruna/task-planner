import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Projects from "./pages/Projects";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Tasks from "./pages/Tasks";
import Footer from "./components/Footer";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUsers from "./pages/AdminUsers";

import "./App.css";

function Shell({ children }) {
  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  return (
    <div className="app-shell">
      {!hideLayout && <Navbar />}
      <main className="app-main">{children}</main>
      {!hideLayout && <Footer />}
    </div>
  );
}

function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <Router>
      <Shell>
        <Routes>
          {/* / -> dashboard dacă e logat, altfel login */}
          <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />

          {/* public */}
          <Route path="/login" element={<Login />} />

          {/* protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />

          {/* fallback */}
          <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Shell>
    </Router>
  );
}

export default App;
