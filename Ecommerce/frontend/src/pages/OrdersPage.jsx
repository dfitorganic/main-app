import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { authFetch } from "../utils/auth";

const formatDate = (value) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusSteps = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
const statusLabels = { PENDING: "Placed", CONFIRMED: "Confirmed", PROCESSING: "Processing", PACKED: "Packed", SHIPPED: "Shipped", DELIVERED: "Delivered" };

const OrdersPage = () => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await authFetch(`${BASEURL}/api/orders/my/`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch orders");
        }

        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [BASEURL]);

  if (loading) {
    return <div className="pt-28 px-6">Loading your orders...</div>;
  }

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div><p className="eyebrow">Order history and tracking</p><h1 className="text-3xl font-bold text-gray-800">My Orders</h1></div>
          <Link to="/" className="text-orange-600 font-medium">
            Continue shopping
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-4">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No orders yet.</p>
            <Link to="/" className="btn-primary inline-block">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow p-6">
                <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product_name} x {item.quantity}
                      </span>
                      <span className="font-medium">₹{Number(item.price).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex flex-wrap gap-3 justify-between text-sm">
                  <span className="text-gray-600">Payment: {order.payment_method}</span>
                  <span className="price">Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="order-tracker"><p className="font-semibold text-gray-800">Order tracking</p><div className="tracker-steps">{statusSteps.map((step) => <span className={statusSteps.indexOf(step) <= statusSteps.indexOf(order.order_status) ? "tracker-step active" : "tracker-step"} key={step}>{statusLabels[step]}</span>)}</div><p className="text-sm text-gray-500">Current status: {statusLabels[order.order_status] || order.order_status}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
