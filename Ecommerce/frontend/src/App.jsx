import { BrowserRouter as Router, Link, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRouter from "./components/PrivateRouter";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import Login from "./pages/Login";
import OrdersPage from "./pages/OrdersPage";
import ProductDetails from "./pages/ProductDetails";
import ProductList from "./pages/ProductList";
import SignUp from "./pages/SignUp";
import ContentPage from "./pages/ContentPage";
import AccountPage from "./pages/AccountPage";
import PasswordReset from "./pages/PasswordReset";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import "./auth.css";

const BackToHome = () => {
  const location = useLocation();
  const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

  if (location.pathname === "/" || authPaths.some((path) => location.pathname.startsWith(path))) return null;

  return <div className="back-home-wrap"><Link className="back-home" to="/">← Back to home</Link></div>;
};

const AppShell = () => {
  const location = useLocation();
  const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isAuthPage = authPaths.some((path) => location.pathname.startsWith(path));

  return (
    <>
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <BackToHome />}
      <Routes>
        <Route element={<PrivateRouter />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/elite" element={<ProductList productType="ELITE" />} />
          <Route path="/essential" element={<ProductList productType="ESSENTIAL" />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<ContentPage type="about" />} />
          <Route path="/contact" element={<ContentPage type="contact" />} />
          <Route path="/privacy" element={<ContentPage type="privacy" />} />
          <Route path="/terms" element={<ContentPage type="terms" />} />
          <Route path="/refund-policy" element={<ContentPage type="refund" />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<PasswordReset />} />
        <Route path="/reset-password/:uid/:token" element={<PasswordReset />} />
      </Routes>
      {!isAuthPage && <Footer />}
    </>
  );
};

const App = () => <Router><AppShell /></Router>;

export default App;
