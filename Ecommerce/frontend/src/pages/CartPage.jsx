import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { getAccessToken } from "../utils/auth";

const CartPage = () => {
  const { cartItems, total, removeFromCart, updateQuantity } = useCart();
  const isLoggedIn = Boolean(getAccessToken());

  const displayTotal = Number(total) || 0;

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Shopping Cart
            <span className="text-lg font-normal text-gray-400 ml-3">
              ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
            </span>
          </h1>
          <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-2">
            Continue shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Add products to place an order.</p>
            <Link to="/" className="btn-primary inline-block">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">{item.product_name}</h2>
                    <span className="price">₹{Number(item.product_price).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} type="button">
                      -
                    </button>
                    <span className="font-semibold text-lg w-8 text-center">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} type="button">
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="price">₹{Number(item.subtotal).toLocaleString("en-IN")}</p>
                    <button
                      className="text-red-500 hover:text-red-600 font-medium text-sm mt-2"
                      onClick={() => removeFromCart(item.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-96">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-28">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Total items</span>
                    <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                </div>

                <div className="border-t-2 border-dashed pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="price">₹{displayTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Link to={isLoggedIn ? "/checkout" : "/login"} className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-2">
                  {isLoggedIn ? "Proceed to checkout" : "Sign in to checkout"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
