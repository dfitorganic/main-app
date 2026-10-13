import { Link } from "react-router-dom";

const collections = [
  { title: "Essential", image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85" },
  { title: "Elite", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85" },
];

const ShopPage = () => {
  return (
    <main className="page">
      <section className="intro-band container">
        <div className="container">
          <span className="eyebrow">The D’FIT shop</span>
          <h1>Choose your collection.</h1>
          <p>Browse Essential and Elite products. Every product appears only in the collection selected for it in the admin panel.</p>
        </div>
      </section>
      <section className="intro-band container">
        <div className="category-grid">
          {collections.map(({ title, image }) => <Link className="category-card" key={title} to={`/${title.toLowerCase()}`} style={{ backgroundImage: `url(${image})` }}><div><span className="eyebrow" style={{ color: "var(--cream)" }}>Shop</span><h3>{title}</h3></div></Link>)}
        </div>
      </section>
    </main>
  );
};

export default ShopPage;