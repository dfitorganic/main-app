import { Link } from "react-router-dom";

const HomePage = () => (
  <main className="page">
    <section className="hero">
      <div className="hero-content">
        <span className="eyebrow">D’FIT Organic</span>
        <h1>Your daily fitness.</h1>
        <p>Wholesome everyday nutrition, crafted with care. A thoughtful pantry for the way you want to live.</p>
        <div className="hero-actions">
          <Link className="button" to="/shop">Shop now</Link>
          <Link className="button secondary" to="/about">Our story</Link>
        </div>
      </div>
    </section>
  </main>
);

export default HomePage;