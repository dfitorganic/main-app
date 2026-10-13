import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { authFetch } from "../utils/auth";

function CheckoutPage() {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const navigate = useNavigate();
  const { clearCart, cartItems, total } = useCart();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    payment_method: "COD",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cartItems.length) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await authFetch(`${BASEURL}/api/order/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to place order.");
        return;
      }

      setOrderId(data.order_id);
      setMessage("Order placed successfully.");
      clearCart();
      setTimeout(() => navigate("/orders"), 1500);
    } catch {
      setMessage("Error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white p-8 rounded-3xl shadow-xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="input-alibaba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="input-alibaba resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  minLength={10}
                  required
                  className="input-alibaba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  className="input-alibaba"
                >
                  <option value="COD">Cash on Delivery</option>
                  <option value="RAZORPAY" disabled>Online payment (Razorpay setup required)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                  loading || cartItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                {loading ? "Processing..." : "Place order"}
              </button>

              {message && (
                <p
                  className={`text-center font-semibold p-4 rounded-xl ${
                    orderId
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  {message}
                  {orderId ? ` Order ID: ${orderId}` : ""}
                </p>
              )}
            </form>
          </div>

          <div className="lg:w-80">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-28">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">₹{Number(item.subtotal).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="price">₹{Number(total).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link to="/cart" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium mt-8">
          Back to cart
        </Link>
      </div>
    </div>
  );
}

export default CheckoutPage;
