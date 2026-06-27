import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../features/auth/authSlice";
import { Navigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock, FaUserTag } from "react-icons/fa";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Student",
  });

  const { name, email, password, confirmPassword, role } = formData;
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  // Show error toast when Redux error changes
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // If already logged in, redirect based on role
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

    if (!name || !email || !password) {
      return toast.error("Please fill in all fields");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    dispatch(registerUser({ name, email, password, role }));
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-animated overflow-hidden px-4">
      
      {/* Floating Orbs — animated background decorations */}
      <div className="orb orb-violet" style={{ width: 300, height: 300, top: '10%', left: '5%' }} />
      <div className="orb orb-cyan" style={{ width: 200, height: 200, bottom: '15%', right: '10%' }} />
      <div className="orb orb-emerald" style={{ width: 150, height: 150, top: '60%', left: '70%' }} />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md fade-in-up">
        
        {/* Glass Card Container */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          
          {/* Logo / Brand */}
          <div className="text-center mb-8 fade-in-up fade-in-delay-1">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" 
                 style={{ background: 'var(--gradient-primary)' }}>
              <span className="text-2xl">🏫</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Join CampusPulse and start reporting campus issues
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">

            {/* Full Name */}
            <div className="fade-in-up fade-in-delay-1">
              <label className="label-premium">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="name"
                  type="text"
                  className="input-premium input-icon"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Email */}
            <div className="fade-in-up fade-in-delay-2">
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

            {/* Role Selector */}
            <div className="fade-in-up fade-in-delay-2">
              <label className="label-premium">I am a</label>
              <div className="relative">
                <FaUserTag className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }} />
                <select
                  name="role"
                  value={role}
                  onChange={onChange}
                  className="select-premium input-icon"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
            </div>

            {/* Password Fields — Side by Side */}
            <div className="grid grid-cols-2 gap-3 fade-in-up fade-in-delay-3">
              <div>
                <label className="label-premium">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }} />
                  <input
                    name="password"
                    type="password"
                    className="input-premium input-icon"
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={onChange}
                  />
                </div>
              </div>
              <div>
                <label className="label-premium">Confirm</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }} />
                  <input
                    name="confirmPassword"
                    type="password"
                    className="input-premium input-icon"
                    placeholder="Repeat"
                    value={confirmPassword}
                    onChange={onChange}
                  />
                </div>
              </div>
            </div>

            {/* Password mismatch indicator */}
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 -mt-2 pl-1">Passwords don't match</p>
            )}

            {/* Submit */}
            <div className="fade-in-up fade-in-delay-4 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
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

          {/* Login Link */}
          <div className="text-center fade-in-up fade-in-delay-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold gradient-text hover:opacity-80 transition">
                Sign In
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

export default RegisterPage;
