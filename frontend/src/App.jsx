import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard"; 
import StaffDashboard from "./pages/StaffDashboard";   
import AdminDashboard from "./pages/AdminDashboard";  

import PrivateRoute from "./components/PrivateRoute";

/* ===========================
   Placeholder Pages (to be built in later phases)
=========================== */

import SecurityDashboard from "./pages/SecurityDashboard";

import HODDashboard from "./pages/HODDashboard";

const Unauthorized = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-animated">
    <div className="glass-strong p-10 rounded-2xl text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-2">403</h1>
      <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>You don't have permission to access this page.</p>
    </div>
  </div>
);

/* ===========================
   App Component
=========================== */
function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student & Faculty share the same dashboard */}
          <Route element={<PrivateRoute allowedRoles={['Student', 'Faculty']} />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Staff Routes (Maintenance) */}
          <Route element={<PrivateRoute allowedRoles={['Maintenance']} />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Security Routes */}
          <Route element={<PrivateRoute allowedRoles={['Security']} />}>
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
          </Route>

          {/* HOD Routes */}
          <Route element={<PrivateRoute allowedRoles={['HOD']} />}>
            <Route path="/hod-dashboard" element={<HODDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      <ToastContainer theme="dark" />
    </>
  );
}

export default App;