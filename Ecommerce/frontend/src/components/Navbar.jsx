import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { authFetch, clearTokens, getAccessToken } from "../utils/auth";

function Navbar() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(getAccessToken()));
    window.addEventListener("auth-changed", syncAuth);

    const loadMe = async () => {
      if (!isLoggedIn) return;
      const response = await authFetch(`${BASEURL}/api/me/`).catch(() => null);
      if (response?.ok) setProfile(await response.json());
      if (response?.status === 401) {
        clearTokens();
        setProfile(null);
      }
    };

    loadMe();
    return () => window.removeEventListener("auth-changed", syncAuth);
  }, [BASEURL, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    authFetch(`${BASEURL}/api/notifications/my/`)
      .then(async (response) => (response?.ok ? response.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]));
  }, [BASEURL, isLoggedIn]);

  const handleLogout = () => {
    clearTokens();
    clearCart();
    setNotifications([]);
    setNotificationsOpen(false);
    navigate("/login");
  };

  const toggleNotifications = async () => {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (opening && unreadCount > 0) {
      const response = await authFetch(`${BASEURL}/api/notifications/read/`, { method: "POST" }).catch(() => null);
      if (response?.ok) setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <header className="site-header">
      <div className="announcement">NATURAL &nbsp;•&nbsp; CLEAN &nbsp;•&nbsp; MADE FOR EVERYDAY WELLNESS</div>
      <div className="nav-inner">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img className="brand-logo" src="/dfit-logo.svg" alt="D'FIT Organic" />
          <span className="brand-copy"><strong>D’FIT</strong><small>Your Daily Fitness</small></span>
        </Link>
        <nav className={`nav-links ${menuOpen ? "mobile-open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          {isLoggedIn && <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>}
        </nav>
        <div className="nav-actions">
          {isLoggedIn && <div className="notification-wrap"><button className="icon-action notification-button" onClick={toggleNotifications} aria-label="View notifications" aria-expanded={notificationsOpen}>🔔{unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}</button>{notificationsOpen && <div className="notification-menu"><div className="notification-heading"><strong>Notifications</strong><span>{notifications.length}</span></div>{notifications.length === 0 ? <p className="notification-empty">No notifications yet.</p> : notifications.map((notification) => <article className="notification-item" key={notification.id}><strong>{notification.title}</strong><p>{notification.message}</p><time>{new Date(notification.created_at).toLocaleString()}</time></article>)}</div>}</div>}
          <Link to={isLoggedIn ? "/account" : "/login"} className="account-link" aria-label={isLoggedIn ? "Open your account" : "Sign in"}>
            <span className="account-avatar">{isLoggedIn ? (profile?.username?.[0] || "A").toUpperCase() : "⌾"}</span>
            <span>{isLoggedIn ? (profile?.username || "Account") : "Sign in"}</span>
          </Link>
          {isLoggedIn && <button className="icon-action" onClick={handleLogout} aria-label="Log out">↪</button>}
          <Link to="/cart" className="cart-link" aria-label="Shopping cart">Bag {cartCount > 0 && <span className="cart-count">{cartCount}</span>}</Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
