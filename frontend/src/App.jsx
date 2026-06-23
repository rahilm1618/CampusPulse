import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 1. Import your real pages here
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard"; 
import StaffDashboard from "./pages/StaffDashboard";   
import AdminDashboard from "./pages/AdminDashboard";  

import PrivateRoute from "./components/PrivateRoute";

/* ===========================
   Placeholder Components (Keep these only if you haven't created the files yet)
=========================== */


const SecurityDashboard = () => (
  <h1 className="text-white text-center mt-20 text-3xl">Security Dashboard (Coming Soon)</h1>
);



/* ===========================
   Unauthorized Page
=========================== */
const Unauthorized = () => (
  <h1 className="text-red-500 text-center mt-20 text-3xl">
    403 – Unauthorized
  </h1>
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
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student Routes */}
          <Route element={<PrivateRoute allowedRoles={['Student']} />}>
            {/* This now points to the imported component, not the placeholder */}
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Staff Routes (Maintenance only) */}
          <Route element={<PrivateRoute allowedRoles={['Maintenance']} />}>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Security Routes */}
          <Route element={<PrivateRoute allowedRoles={['Security']} />}>
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
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