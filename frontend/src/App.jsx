import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";

// Import des pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUsers from "./pages/AdminUsers";

function App() {
  const [message, setMessage] = useState("");

  // Appel backend au démarrage
  useEffect(() => {
    axios
      .get("http://localhost:5000")
      .then((res) => setMessage(res.data))
      .catch((err) => console.error("Erreur:", err));
  }, []);

  return (
    <Router>
      <Routes>
        {/* Page de login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard par défaut */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboards spécifiques */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/user"
          element={
            <ProtectedRoute requiredRoles={["ADMIN"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute requiredRoles={["HR"]}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute requiredRoles={["EMPLOYEE"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute requiredRoles={["COORDINATOR"]}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Route de fallback pour les routes non trouvées */}

      </Routes>
    </Router>
  );
}

export default App;
