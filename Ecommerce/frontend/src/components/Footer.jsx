import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <Link to="/" className="brand"><img className="brand-logo" src="/dfit-logo.svg" alt="D'FIT Organic" /><span className="brand-copy"><strong>D’FIT</strong><small>Your Daily Fitness</small></span></Link>
          <p>Wholesome everyday nutrition, crafted with care.</p>
        </div>
        <div><h3>Explore</h3><p><Link to="/">Home</Link><br /><Link to="/shop">Shop</Link><br /><Link to="/about">About</Link><br /><Link to="/contact">Contact</Link></p></div>
        <div><h3>Customer</h3><p><Link to="/account">My account</Link><br /><Link to="/orders">My orders</Link><br /><Link to="/shipping">Shipping</Link><br /><Link to="/refund-policy">Returns</Link></p></div>
        <div><h3>Stay connected</h3><p>hello@dfitorganic.com<br />Instagram @dfitorganic</p></div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} D’FIT Organic. Made for everyday wellness.</div>
    </div>
  </footer>
);

export default Footer;
