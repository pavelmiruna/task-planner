import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Projects from "./pages/Projects";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Tasks from "./pages/Tasks";
import Footer from "./components/Footer";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar/>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/teams" element={<Teams />} />
            <Route path = "/tasks" element = {<Tasks/>}/>
            <Route path="/notifications" element={<Notifications />} />
            <Route path = "/profile" element = {<Profile/>}/>
          </Routes>
        </main>
        <Footer/>
      </div>
    </Router>
  );
}

export default App;
