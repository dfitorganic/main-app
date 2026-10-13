import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { authFetch } from "../utils/auth";

const AccountPage = () => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const responses = await Promise.all([
          authFetch(`${BASEURL}/api/me/`),
          authFetch(`${BASEURL}/api/orders/my/`),
          authFetch(`${BASEURL}/api/addresses/`),
        ]);
        const payloads = await Promise.all(responses.map((response) => response.json()));
        const failedResponse = responses.find((response) => !response.ok);
        if (failedResponse) {
          throw new Error(payloads[0]?.detail || payloads[0]?.error || "Unable to load your account.");
        }
        setProfile(payloads[0]);
        setOrders(payloads[1]);
        setAddresses(payloads[2]);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [BASEURL]);

  if (loading) return <main className="content-page container">Loading your account...</main>;

  return (
    <main className="content-page container">
      <span className="eyebrow">Your D'FIT account</span>
      <h1>Welcome back, {profile?.username || "friend"}.</h1>
      {error && <p className="form-message">{error}</p>}

      <div className="account-grid">
        <section className="account-panel"><span className="eyebrow">Profile</span><h2>{profile?.username}</h2><p>{profile?.email || "No email added"}</p></section>
        <section className="account-panel"><span className="eyebrow">Orders</span><h2>{orders.length}</h2><Link className="text-link" to="/orders">View order history</Link></section>
        <section className="account-panel"><span className="eyebrow">Saved addresses</span><h2>{addresses.length}</h2><p>{addresses.length ? addresses[0].city : "No saved addresses yet."}</p></section>
      </div>

      <section className="account-orders">
        <div className="section-heading"><div><span className="eyebrow">Recent activity</span><h2>Your latest orders.</h2></div><Link className="text-link" to="/shop">Continue shopping</Link></div>
        {orders.length === 0 ? <p className="empty-state">Your first order is waiting in the pantry.</p> : <div className="order-list">{orders.slice(0, 3).map((order) => <article className="order-row" key={order.id}><div><strong>{order.order_number || `Order #${order.id}`}</strong><span>{new Date(order.created_at).toLocaleDateString("en-IN")}</span></div><span className="order-status">{order.order_status}</span><strong>₹{Number(order.total_amount).toLocaleString("en-IN")}</strong></article>)}</div>}
      </section>
    </main>
  );
};

export default AccountPage;