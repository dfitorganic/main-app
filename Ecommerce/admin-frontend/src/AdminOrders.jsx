import { useEffect, useState } from "react";

import { authFetch } from "./utils/auth";

const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL || "http://127.0.0.1:8000";
const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { detail: text }; }
};

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await authFetch(`${baseUrl}/api/admin/orders/`);
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.detail || data.error || "Unable to load orders.");
    setOrders(data);
    if (selected) setSelected(data.find((order) => order.id === selected.id) || null);
  };

  // Orders synchronize this screen with the shared Django API on entry.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

  const updateStatus = async (field, value) => {
    const response = await authFetch(`${baseUrl}/api/admin/orders/${selected.id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    const data = await readJson(response);
    if (!response.ok) { setMessage(data.error || "Unable to update order."); return; }
    setSelected(data);
    setOrders((current) => current.map((order) => order.id === data.id ? data : order));
  };

  if (selected) return <section className="admin-orders"><button className="secondary" onClick={() => setSelected(null)}>Back to all orders</button><div className="invoice" id="invoice"><div className="invoice-head"><div><span className="eyebrow">D'FIT ORGANIC</span><h2>Invoice</h2></div><strong>{selected.order_number || `Order #${selected.id}`}</strong></div><div className="invoice-meta"><div><b>Customer</b><span>{selected.name}</span><span>{selected.customer_email || "No email"}</span><span>{selected.phone}</span></div><div><b>Shipping</b><span>{selected.shipping_details?.address || selected.address}</span><span>{selected.shipping_details?.city || ""} {selected.shipping_details?.state || ""}</span><span>{selected.shipping_details?.postal_code || ""}</span></div><div><b>Date</b><span>{new Date(selected.created_at).toLocaleString("en-IN")}</span><span>Payment: {selected.payment_status}</span><span>Status: {selected.order_status}</span></div></div><table><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{selected.items.map((item) => <tr key={item.id}><td>{item.product_name}</td><td>{item.sku_snapshot || "-"}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(item.subtotal)}</td></tr>)}</tbody></table><div className="invoice-total"><span>Subtotal: {money(selected.subtotal)}</span><span>Shipping: {money(selected.shipping_fee)}</span><strong>Total: {money(selected.total_amount)}</strong></div></div><div className="invoice-actions"><select value={selected.order_status} onChange={(event) => updateStatus("order_status", event.target.value)}>{["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}</select><select value={selected.payment_status} onChange={(event) => updateStatus("payment_status", event.target.value)}>{["PENDING", "PAID", "FAILED", "REFUNDED"].map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => window.print()}>Print invoice</button></div></section>;

  return <section className="admin-orders"><div className="catalog-title"><div><span className="eyebrow">Sales history</span><h2>Customer orders</h2></div><span>{orders.length} orders</span></div>{message && <div className="notice">{message}</div>}{orders.length === 0 ? <p>No orders have been received yet.</p> : <div className="orders-table">{orders.map((order) => <button className="order-card" key={order.id} onClick={() => setSelected(order)}><span><strong>{order.order_number || `Order #${order.id}`}</strong><small>{order.name} · {order.customer_email || "Guest checkout"}</small></span><span><small>{new Date(order.created_at).toLocaleDateString("en-IN")}</small><b>{money(order.total_amount)}</b></span><span className="status-pill">{order.order_status}</span></button>)}</div>}</section>;
}