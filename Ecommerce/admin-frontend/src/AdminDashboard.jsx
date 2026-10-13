import { useEffect, useState } from "react";

import { authFetch } from "./utils/auth";

const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL || "http://127.0.0.1:8000";

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { detail: text }; }
};

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const [data, setData] = useState({ products: [], orders: [], users: [], reviews: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const responses = await Promise.all([
        authFetch(`${baseUrl}/api/admin/products/`),
        authFetch(`${baseUrl}/api/admin/orders/`),
        authFetch(`${baseUrl}/api/admin/users/`),
        authFetch(`${baseUrl}/api/admin/reviews/`),
      ]);
      const payloads = await Promise.all(responses.map(readJson));
      if (responses.some((response) => !response.ok)) throw new Error("Unable to load dashboard analytics.");
      setData({ products: payloads[0], orders: payloads[1], users: payloads[2], reviews: payloads[3] });
    };

    load().catch((loadError) => setError(loadError.message));
  }, []);

  const activeProducts = data.products.filter((product) => product.is_active);
  const lowStock = activeProducts.filter((product) => Number(product.stock_quantity) <= Number(product.low_stock_threshold || 5));
  const customers = data.users.filter((user) => !user.is_staff && !user.is_superuser);
  const pendingOrders = data.orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.order_status));
  const revenue = data.orders.reduce((total, order) => total + Number(order.total_amount || 0), 0);
  const essentialProducts = data.products.filter((product) => product.product_type === "ESSENTIAL").length;
  const eliteProducts = data.products.filter((product) => product.product_type === "ELITE").length;

  return <section className="dashboard"><div className="dashboard-heading"><div><span className="eyebrow">Business overview</span><h2>Dashboard</h2><p>Live analytics from your catalog, customers, orders, and reviews.</p></div><span className="dashboard-refresh">Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></div>{error && <div className="error">{error}</div>}<div className="metric-grid"><article className="metric-card"><span>Total revenue</span><strong>{money(revenue)}</strong><small>{data.orders.length} orders</small></article><article className="metric-card"><span>Customers</span><strong>{customers.length}</strong><small>Registered buyers</small></article><article className="metric-card"><span>Active products</span><strong>{activeProducts.length}</strong><small>{data.products.length} total catalog items</small></article><article className="metric-card"><span>Pending orders</span><strong>{pendingOrders.length}</strong><small>Needs fulfillment</small></article></div><div className="dashboard-grid"><section className="analytics-panel"><div className="catalog-title"><h3>Catalog mix</h3><span>{data.reviews.length} reviews</span></div><div className="analytics-row"><span>Essential</span><b>{essentialProducts}</b><div className="analytics-bar"><i style={{ width: `${data.products.length ? (essentialProducts / data.products.length) * 100 : 0}%` }} /></div></div><div className="analytics-row"><span>Elite</span><b>{eliteProducts}</b><div className="analytics-bar"><i style={{ width: `${data.products.length ? (eliteProducts / data.products.length) * 100 : 0}%` }} /></div></div><div className="analytics-row"><span>Low stock</span><b>{lowStock.length}</b><div className="analytics-bar warning"><i style={{ width: `${activeProducts.length ? (lowStock.length / activeProducts.length) * 100 : 0}%` }} /></div></div></section><section className="analytics-panel"><div className="catalog-title"><h3>Recent orders</h3><span>{data.orders.length} total</span></div>{data.orders.slice(0, 5).map((order) => <div className="dashboard-order" key={order.id}><span><strong>{order.order_number || `Order #${order.id}`}</strong><small>{order.name}</small></span><span><b>{money(order.total_amount)}</b><small>{order.order_status}</small></span></div>)}{data.orders.length === 0 && <p className="dashboard-empty">No orders yet.</p>}</section></div></section>;
}