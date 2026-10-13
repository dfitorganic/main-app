import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { saveToken } from '../utils/auth'


function Login() {
  const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        saveToken(data);
        setMsg("Login successful! Redirecting...");
        const destination = location.state?.from;
        const destinationUrl = destination ? `${destination.pathname}${destination.search || ""}` : "/";
        nav(destinationUrl, { replace: true });
      } else {
        setMsg(data.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setMsg("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6 pt-24">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className='bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up'>
          {/* Logo */}
          <div className='text-center mb-8'>
            <div className='w-16 h-16 bg-gradient-button rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <img src="/dfit-logo.svg" alt="D'FIT Organic" className="auth-logo" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
            <p className='text-gray-500 text-sm mt-1'>Sign in to continue shopping</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Email</label>
              <div className='relative'>
                <span className='input-icon'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  onChange={handleChange}
                  value={form.email}
                  placeholder="Enter email"
                  required
                  className="input-alibaba with-icon"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Password</label>
              <div className='relative'>
                <span className='input-icon'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  onChange={handleChange}
                  value={form.password}
                  placeholder="Enter password"
                  required
                  className="input-alibaba with-icon"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input type="checkbox" className='w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500' />
                <span className='text-sm text-gray-600'>Remember me</span>
              </label>
              <Link to="/forgot-password" className='text-sm text-orange-500 hover:text-orange-600 font-medium'>Forgot password?</Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Message */}
          {msg && (
            <div className={`mt-4 p-3 rounded-xl text-center text-sm font-medium ${msg.includes("successful")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
              }`}>
              {msg}
            </div>
          )}

          {/* Divider */}
          <div className='flex items-center gap-4 my-6'>
            <div className='flex-1 h-px bg-gray-200'></div>
            <span className='text-sm text-gray-400'>or continue with</span>
            <div className='flex-1 h-px bg-gray-200'></div>
          </div>

          {/* Social Login Placeholders */}
          <div className='grid grid-cols-2 gap-4'>
            <button className='flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors'>
              <span className='text-xl'>📧</span>
              <span className='text-sm font-medium text-gray-600'>Google</span>
            </button>
            <button className='flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors'>
              <span className='text-xl'>📱</span>
              <span className='text-sm font-medium text-gray-600'>Phone</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className='text-gray-600'>
              Don't have an account?{" "}
              <Link to="/signup" className="text-orange-500 hover:text-orange-600 font-semibold">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Footer */}
        <div className='mt-6 text-center text-sm text-gray-400 flex items-center justify-center gap-4'>
          <span>🔒 Secure Login</span>
          <span>•</span>
          <span>256-bit SSL</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
