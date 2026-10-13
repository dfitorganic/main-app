/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { authFetch, clearTokens, getAccessToken } from "../utils/auth";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = Boolean(getAccessToken());

  const resetCart = () => {
    setCartItems([]);
    setTotal(0);
  };

  const fetchCart = async () => {
    if (!getAccessToken()) {
      resetCart();
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(`${BASEURL}/api/cart/`);
      if (response.status === 401) {
        clearTokens();
        resetCart();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch cart");
      }

      setCartItems(data.items || []);
      setTotal(Number(data.total || 0));
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!getAccessToken()) {
      return false;
    }

    try {
      const response = await authFetch(`${BASEURL}/api/cart/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });

      if (!response.ok) {
        return false;
      }

      await fetchCart();
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await authFetch(`${BASEURL}/api/cart/remove/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await authFetch(`${BASEURL}/api/cart/update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, quantity }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setTotal(0);
  };

  useEffect(() => {
    fetchCart();
    // keep this mount-only for now; after login the user returns to the app and mounts fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        total,
        loading,
        isLoggedIn,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
