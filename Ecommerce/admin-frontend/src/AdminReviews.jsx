import { useEffect, useState } from "react";

import { authFetch } from "./utils/auth";

const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL || "http://127.0.0.1:8000";

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { detail: text }; }
};

const emptyForm = { product: "", author_name: "", rating: 5, title: "", comment: "", is_approved: true };

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [reviewsResponse, productsResponse] = await Promise.all([authFetch(`${baseUrl}/api/admin/reviews/`), authFetch(`${baseUrl}/api/admin/products/`)]);
    const reviewsData = await readJson(reviewsResponse);
    const productsData = await readJson(productsResponse);
    if (!reviewsResponse.ok || !productsResponse.ok) throw new Error("Unable to load reviews.");
    setReviews(reviewsData);
    setProducts(productsData);
  };

  // Load persisted reviews once when the admin workspace opens.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => setMessage("Unable to load reviews.")); }, []);

  const save = async (event) => {
    event.preventDefault();
    const url = editingId ? `${baseUrl}/api/admin/reviews/${editingId}/` : `${baseUrl}/api/admin/reviews/`;
    const response = await authFetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, product: Number(form.product), rating: Number(form.rating) }) });
    const data = await readJson(response);
    if (!response.ok) { setMessage(data.detail || data.error || "Unable to save review."); return; }
    setMessage(editingId ? "Review updated." : "Review added.");
    setForm(emptyForm);
    setEditingId(null);
    await load();
  };

  const edit = (review) => { setEditingId(review.id); setForm({ product: String(review.product), author_name: review.author_name, rating: review.rating, title: review.title || "", comment: review.comment, is_approved: review.is_approved }); };
  const remove = async (id) => { if (!window.confirm("Delete this review?")) return; const response = await authFetch(`${baseUrl}/api/admin/reviews/${id}/`, { method: "DELETE" }); setMessage(response.ok ? "Review deleted." : "Unable to delete review."); if (response.ok) await load(); };

  return <section className="admin-notifications"><div className="catalog-title"><div><span className="eyebrow">Customer feedback</span><h2>{editingId ? "Edit review" : "Add review"}</h2></div></div><form className="notification-form" onSubmit={save}><select value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input placeholder="Reviewer name (real or display name)" value={form.author_name} onChange={(event) => setForm({ ...form, author_name: event.target.value })} required /><select value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input placeholder="Review title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea placeholder="Review text" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} required /><label><input type="checkbox" checked={form.is_approved} onChange={(event) => setForm({ ...form, is_approved: event.target.checked })} /> Show on buyer website</label><button>{editingId ? "Update review" : "Add review"}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}</form>{message && <div className="notice">{message}</div>}<div className="order-list">{reviews.map((review) => <article className="order-row" key={review.id}><div><strong>{review.product_name}</strong><span>{review.author_name} · {review.rating}/5</span><span>{review.comment}</span></div><div className="actions"><button onClick={() => edit(review)}>Edit</button><button className="danger" onClick={() => remove(review.id)}>Delete</button></div></article>)}</div></section>;
}