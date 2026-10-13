import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function SignUp() {
    const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
    const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    // Simple password strength calculation
    const getPasswordStrength = () => {
        const pwd = form.password;
        if (!pwd) return { level: 0, text: '', color: 'bg-gray-200' };
        if (pwd.length < 6) return { level: 1, text: 'Weak', color: 'bg-red-500' };
        if (pwd.length < 10) return { level: 2, text: 'Medium', color: 'bg-yellow-500' };
        return { level: 3, text: 'Strong', color: 'bg-green-500' };
    };

    const pwdStrength = getPasswordStrength();

    const handleSubmit = async e => {
        e.preventDefault();
        setMsg("");
        setLoading(true);

        if (form.password !== form.password2) {
            setMsg("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${BASE}/api/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setMsg("Account created successfully! Redirecting to login...");
                setTimeout(() => nav("/login"), 1500);
            } else {
                setMsg(data.username || data.password || data.email || JSON.stringify(data));
            }
        } catch (err) {
            console.error(err);
            setMsg("Signup failed. Please try again.");
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
                        <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                        <p className='text-gray-500 text-sm mt-1'>Join us for amazing deals!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Username</label>
                            <div className='relative'>
                                <span className='input-icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    name="username"
                                    onChange={handleChange}
                                    value={form.username}
                                    placeholder="Choose a username"
                                    required
                                    className="input-alibaba with-icon"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Email Address</label>
                            <div className='relative'>
                                <span className='input-icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <input
                                    name="email"
                                    type="email"
                                    onChange={handleChange}
                                    value={form.email}
                                    placeholder="your@email.com"
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
                                    placeholder="Create a password"
                                    required
                                    className="input-alibaba with-icon"
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
                            </div>
                            {/* Password Strength Indicator */}
                            {form.password && (
                                <div className='mt-2'>
                                    <div className='flex gap-1'>
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1.5 flex-1 rounded-full transition-all ${pwdStrength.level >= level ? pwdStrength.color : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs mt-1 ${pwdStrength.level === 1 ? 'text-red-500' :
                                            pwdStrength.level === 2 ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        Password strength: {pwdStrength.text}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Confirm Password</label>
                            <div className='relative'>
                                <span className='input-icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                <input
                                    name="password2"
                                    type={showPassword2 ? "text" : "password"}
                                    onChange={handleChange}
                                    value={form.password2}
                                    placeholder="Confirm your password"
                                    required
                                    className={`input-alibaba with-icon ${form.password2 && form.password !== form.password2
                                            ? 'border-red-500 focus:border-red-500'
                                            : ''
                                        }`}
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword2(!showPassword2)}>{showPassword2 ? "Hide" : "Show"}</button>
                            </div>
                            {form.password2 && form.password !== form.password2 && (
                                <p className='text-xs text-red-500 mt-1'>Passwords do not match</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className='flex items-start gap-3'>
                            <input
                                type="checkbox"
                                required
                                className='w-4 h-4 mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500'
                            />
                            <p className='text-sm text-gray-600'>
                                I agree to the{' '}
                                <a href="#" className='text-orange-500 hover:underline'>Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className='text-orange-500 hover:underline'>Privacy Policy</a>
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || form.password !== form.password2}
                            className={`btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 ${loading || form.password !== form.password2 ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Message */}
                    {msg && (
                        <div className={`mt-4 p-3 rounded-xl text-center text-sm font-medium ${msg.includes("successfully")
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                            {msg}
                        </div>
                    )}

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className='text-gray-600'>
                            Already have an account?{" "}
                            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className='mt-6 text-center text-sm text-gray-400 flex items-center justify-center gap-4'>
                    <span>🔒 Your data is safe</span>
                    <span>•</span>
                    <span>No spam, ever</span>
                </div>
            </div>
        </div>
    );
}

export default SignUp;