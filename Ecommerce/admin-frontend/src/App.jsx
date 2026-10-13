import { useEffect, useState } from "react";

import { authFetch, clearTokens, getAccessToken, setTokens } from "./utils/auth";
import AdminOrders from "./AdminOrders";
import AdminNotifications from "./AdminNotifications";
import AdminReviews from "./AdminReviews";
import AdminDashboard from "./AdminDashboard";

const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL || "http://127.0.0.1:8000";

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
};

function Login({ onAuthenticated }) {
  const [email, setEmail] = useState("businessmail21.01.2007@gmail.com");
  const [password, setPassword] = useState("adhi7837&K");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseUrl}/api/admin/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.detail || `Admin login failed (HTTP ${response.status}).`);
      setTokens(data);
      onAuthenticated();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-shell"><form className="login-card" onSubmit={submit}><span className="eyebrow">D'FIT ORGANIC</span><h1>Admin workspace</h1><p>Manage the catalog through the shared Django API.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label><label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div><small>{password.length} characters entered</small></label>{error && <div className="error">{error}</div>}<button disabled={loading}>{loading ? "Checking access..." : "Sign in"}</button></form></main>;
}

function Products({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ product_type: "ESSENTIAL", name: "", description: "", price: "", original_price: "", stock_quantity: "", category: "", image: null });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([authFetch(`${baseUrl}/api/admin/products/`), fetch(`${baseUrl}/api/categories/`)]);
    if (productsResponse.status === 401 || productsResponse.status === 403) { clearTokens(); onLogout(); return; }
    const productsData = await readJson(productsResponse);
    const categoriesData = await readJson(categoriesResponse);
    if (!productsResponse.ok) throw new Error(productsData.detail || "Unable to load products.");
    if (!categoriesResponse.ok) throw new Error(categoriesData.detail || "Unable to load categories.");
    setProducts(Array.isArray(productsData) ? productsData : []);
    setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    setLoading(false);
  };

  // Catalog loading synchronizes this screen with the shared Django API.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load().catch(() => setMessage("Unable to load catalog.")); }, []);

  const submit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => { if (value !== null && value !== "") payload.append(key, value); });
    const url = editingId ? `${baseUrl}/api/admin/products/${editingId}/` : `${baseUrl}/api/admin/products/`;
    const response = await authFetch(url, { method: editingId ? "PATCH" : "POST", body: payload });
    const data = await readJson(response);
    if (!response.ok) { setMessage(data.detail || data.error || "Unable to save product."); return; }
    setMessage(editingId ? "Product updated." : "Product created.");
    setForm({ product_type: "ESSENTIAL", name: "", description: "", price: "", original_price: "", stock_quantity: "", category: "", image: null });
    setEditingId(null);
    await load();
  };

  const edit = (product) => { setEditingId(product.id); setForm({ product_type: product.product_type || "ESSENTIAL", name: product.name, description: product.description || "", price: product.price, original_price: product.original_price || "", stock_quantity: product.stock_quantity, category: String(product.category?.id || ""), image: null }); };
  const archive = async (id) => { if (!window.confirm("Archive this product?")) return; const response = await authFetch(`${baseUrl}/api/admin/products/${id}/archive/`, { method: "POST" }); const data = await readJson(response); if (!response.ok) { setMessage(data.error || "Unable to archive product."); return; } setMessage("Product archived."); await load(); };
  const remove = async (id) => { if (!window.confirm("Permanently delete this product? This cannot be undone.")) return; const response = await authFetch(`${baseUrl}/api/admin/products/${id}/delete/`, { method: "DELETE" }); const data = await readJson(response); if (!response.ok) { setMessage(data.error || "Unable to delete product."); return; } setMessage("Product deleted."); await load(); };

  return <main className="admin-shell"><header className="admin-header"><div><span className="eyebrow">D'FIT ORGANIC</span><h1>Admin workspace</h1></div><button className="secondary" onClick={() => { clearTokens(); onLogout(); }}>Log out</button></header><AdminDashboard /><div className="admin-grid"><form className="product-form" onSubmit={submit}><h2>{editingId ? "Edit product" : "Add product"}</h2><select value={form.product_type} onChange={(event) => setForm({ ...form, product_type: event.target.value })} required><option value="">Select collection</option><option value="ESSENTIAL">Essential</option><option value="ELITE">Elite</option></select><input placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><input type="number" step="0.01" placeholder="Selling price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /><input type="number" step="0.01" placeholder="Original price (optional discount)" value={form.original_price} onChange={(event) => setForm({ ...form, original_price: event.target.value })} /><input type="number" min="0" placeholder="Available stock" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} required /><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} /><button>{editingId ? "Update product" : "Create product"}</button>{message && <div className="notice">{message}</div>}</form><section className="catalog"><div className="catalog-title"><h2>Catalog</h2><span>{products.length} products</span></div>{loading ? <p>Loading catalog...</p> : products.map((product) => <article className="product-row" key={product.id}><div>{product.image && <img src={product.image} alt="" />}<div><strong>{product.name}</strong><span>{product.product_type === "ELITE" ? "Elite" : "Essential"}</span><span>{product.category?.name || "Uncategorized"}</span><span>{product.is_active ? "Active" : "Archived"}</span><span>Stock: {product.stock_quantity}</span>{product.discount_percentage > 0 && <span>Discount: {product.discount_percentage}%</span>}</div></div><b>INR {Number(product.price).toLocaleString("en-IN")}</b><div className="actions"><button onClick={() => edit(product)}>Edit</button>{product.is_active && <button className="danger" onClick={() => archive(product.id)}>Archive</button>}<button className="danger" onClick={() => remove(product.id)}>Delete</button></div></article>)}</section></div><AdminOrders /><AdminNotifications /><AdminReviews /></main>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getAccessToken()));
  return authenticated ? <Products onLogout={() => setAuthenticated(false)} /> : <Login onAuthenticated={() => setAuthenticated(true)} />;
}