import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authslice";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { email, password } = formData;

  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  /* ===========================
     SHOW ERROR TOAST ONCE
  ============================ */
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /* ===========================
     REDIRECT (RENDER LEVEL)
  ============================ */
  if (user) {
    if (user.role === "Admin") return <Navigate to="/admin-dashboard" replace />;
    if (user.role === "Security") return <Navigate to="/security-dashboard" replace />;
    if (user.role === "Maintenance") return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    <div className="flex h-screen w-full items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-gray-800 p-10 shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Campus Incident System
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <input
              name="email"
              type="email"
              className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white"
              placeholder="Email address"
              value={email}
              onChange={onChange}
            />

            <input
              name="password"
              type="password"
              className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white"
              placeholder="Password"
              value={password}
              onChange={onChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;