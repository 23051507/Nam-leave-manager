import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import HRDashboard from "./pages/HRDashboard";
import EmployeeRequests from "./pages/EmployeeRequests";
import CoordinatorApprovals from "./pages/CoordinatorApprovals";
import HRBalances from "./pages/HRBalances";
import AdminUsers from "./pages/AdminUsers";
import LeaveRequestForm from "./pages/LeaveRequestForm";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Page de connexion */}
        <Route path="/" element={<Login />} />

          {/* Routes protégées */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/employee/new"
            element={
              <ProtectedRoute requiredRoles={["EMPLOYEE"]}>
                <LeaveRequestForm />
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
          <Route
            path="/coordinator/approvals"
            element={
              <ProtectedRoute requiredRoles={["COORDINATOR"]}>
                <CoordinatorApprovals />
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
            path="/hr/balances"
            element={
              <ProtectedRoute requiredRoles={["HR"]}>
                <HRBalances />
              </ProtectedRoute>
            }
          />

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
            path="*"
            element={
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Page non trouvée</h2>
                <p>La route demandée n'existe pas.</p>
                <a href="/dashboard">Retour au tableau de bord</a>
              </div>
            }
          />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
