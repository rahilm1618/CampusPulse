import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";
import { Navigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEnvelope, FaLock } from "react-icons/fa";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { email, password } = formData;

  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  // Show error toast once
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Redirect if logged in
  if (user) {
    if (user.role === "Admin") return <Navigate to="/admin-dashboard" replace />;
    if (user.role === "Security") return <Navigate to="/security-dashboard" replace />;
    if (user.role === "Maintenance") return <Navigate to="/staff-dashboard" replace />;
    if (user.role === "HOD") return <Navigate to="/hod-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
    } else {
      dispatch(loginUser({ email, password }));
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-animated overflow-hidden px-4">
      
      {/* Floating Orbs */}
      <div className="orb orb-violet" style={{ width: 350, height: 350, top: '5%', right: '10%' }} />
      <div className="orb orb-cyan" style={{ width: 250, height: 250, bottom: '10%', left: '5%' }} />
      <div className="orb orb-emerald" style={{ width: 120, height: 120, top: '50%', left: '60%' }} />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md fade-in-up">
        
        <div className="glass-strong rounded-2xl p-8 shadow-2xl" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          
          {/* Brand Header */}
          <div className="text-center mb-8 fade-in-up fade-in-delay-1">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
                 style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-2xl">🏫</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to your CampusPulse account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">

            {/* Email */}
            <div className="fade-in-up fade-in-delay-1">
              <label className="label-premium">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="email"
                  type="email"
                  className="input-premium input-icon"
                  placeholder="you@campus.com"
                  value={email}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Password */}
            <div className="fade-in-up fade-in-delay-2">
              <label className="label-premium">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="password"
                  type="password"
                  className="input-premium input-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="fade-in-up fade-in-delay-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          {/* Register Link */}
          <div className="text-center fade-in-up fade-in-delay-3">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold gradient-text hover:opacity-80 transition">
                Create One
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Report • Track • Resolve — Campus incidents in real-time
        </p>
      </div>
    </div>
  );
};

export default LoginPage;