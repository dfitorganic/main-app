import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const PasswordReset = () => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const { uid, token } = useParams();
  const isConfirmation = Boolean(uid && token);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ password: "", password2: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const endpoint = isConfirmation ? `${BASEURL}/api/password-reset/confirm/` : `${BASEURL}/api/password-reset/`;
    const body = isConfirmation ? { uid, token, ...form } : { email };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.email?.[0] || "Unable to reset password.");
      setMessage(data.message);
      if (!isConfirmation) setEmail("");
      if (isConfirmation) setForm({ password: "", password2: "" });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content-page container">
      <div className="auth-panel">
        <img src="/dfit-logo.svg" alt="D'FIT Organic" className="auth-logo" />
        <span className="eyebrow">Account access</span>
        <h1>{isConfirmation ? "Choose a new password" : "Reset your password"}</h1>
        <p>{isConfirmation ? "Create a new password for your D'FIT account." : "Enter your account email and we will send password reset instructions."}</p>
        <form onSubmit={submit} className="auth-form">
          {!isConfirmation && <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>}
          {isConfirmation && <><label>New password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} autoComplete="new-password" /></label><label>Confirm new password<input type="password" value={form.password2} onChange={(event) => setForm({ ...form, password2: event.target.value })} required minLength={8} autoComplete="new-password" /></label></>}
          <button type="submit" className="button" disabled={loading}>{loading ? "Working..." : isConfirmation ? "Update password" : "Send reset instructions"}</button>
        </form>
        {message && <p className="form-message success-message">{message}</p>}
        {error && <p className="form-message">{error}</p>}
        <Link to="/login" className="text-link">Back to sign in</Link>
      </div>
    </main>
  );
};

export default PasswordReset;
