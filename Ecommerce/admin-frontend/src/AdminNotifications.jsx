import { useEffect, useState } from "react";

import { authFetch } from "./utils/auth";

const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL || "http://127.0.0.1:8000";

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { detail: text }; }
};

export default function AdminNotifications() {
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    authFetch(`${baseUrl}/api/admin/users/`).then(readJson).then(setUsers).catch(() => setResult("Unable to load users."));
  }, []);

  const send = async (event) => {
    event.preventDefault();
    const response = await authFetch(`${baseUrl}/api/admin/notifications/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient_id: recipient || null, title, message }) });
    const data = await readJson(response);
    setResult(response.ok ? `Notification sent to ${data.recipient_count} user(s).` : data.error || "Unable to send notification.");
    if (response.ok) { setTitle(""); setMessage(""); }
  };

  return <section className="admin-notifications"><div className="catalog-title"><div><span className="eyebrow">Customer communication</span><h2>Send notification</h2></div></div><form className="notification-form" onSubmit={send}><select value={recipient} onChange={(event) => setRecipient(event.target.value)}><option value="">All customers</option>{users.filter((user) => !user.is_staff).map((user) => <option key={user.id} value={user.id}>{user.username} · {user.email || "No email"}</option>)}</select><input placeholder="Notification title" value={title} onChange={(event) => setTitle(event.target.value)} required /><textarea placeholder="Write your message" value={message} onChange={(event) => setMessage(event.target.value)} required /><button>Send notification</button></form>{result && <div className="notice">{result}</div>}</section>;
}