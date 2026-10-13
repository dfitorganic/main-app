import { useEffect, useMemo, useState } from "react";

import ProductCard from "../components/ProductCard";

const ProductList = ({ productType = "" }) => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const params = useMemo(() => {
    const searchParams = new URLSearchParams();
    if (query.trim()) {
      searchParams.set("search", query.trim());
    }
    if (selectedCategory) {
      searchParams.set("category", selectedCategory);
    }
    if (productType) {
      searchParams.set("product_type", productType);
    }
    searchParams.set("sort", sortBy);
    return searchParams.toString();
  }, [query, selectedCategory, sortBy, productType]);

  useEffect(() => {
    document.title = productType === "ELITE" ? "Elite Collection | D'FIT Organic" : productType === "ESSENTIAL" ? "Essential Collection | D'FIT Organic" : "D'FIT Organic | Everyday Nutrition";
  }, [productType]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${BASEURL}/api/categories/`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setCategories(data);
      } catch {
        // categories are optional for rendering; ignore errors here
      }
    };

    loadCategories();
  }, [BASEURL]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${BASEURL}/api/products/?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();

    return () => controller.abort();
  }, [BASEURL, params]);

  const renderProducts = (limit) => (
    <div className="product-grid">
      {loading ? [...Array(limit)].map((_, index) => <div className="product-card" key={index}><div className="skeleton product-image" /><div className="product-info"><div className="skeleton" style={{ height: 13, width: "50%" }} /><div className="skeleton" style={{ height: 24, marginTop: 12 }} /></div></div>) : (productType ? products : products.slice(0, limit)).map((product) => <ProductCard key={product.id} product={product} />)}
      {!loading && products.length === 0 && <div className="empty-state">No products match your filters. Try another search.</div>}
    </div>
  );

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">D’FIT Organic</span>
          <h1>{productType === "ELITE" ? "The Elite collection." : productType === "ESSENTIAL" ? "Everyday essentials." : "Your daily fitness."}</h1>
          <p>Wholesome everyday nutrition, crafted with care. A thoughtful pantry for the way you want to live.</p>
          <div className="hero-actions"><a className="button" href="#featured">Shop now</a>{!productType && <a className="button secondary" href="#story">Our story</a>}</div>
        </div>
      </section>
      <section className="intro-band container">
        <span className="eyebrow">Goodness, simply made</span>
        <p>D’FIT brings together honest ingredients and careful craft to make everyday nourishment feel considered, delicious, and easy.</p>
        <div className="category-grid" style={{ marginTop: 32 }}>
          {["Ghee", "Yogurt", "Health Mix"].map((name, index) => <a className="category-card" key={name} href={`/shop?category=${categories[index]?.slug || ""}`} style={{ backgroundImage: `url(${["https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=800&q=80"][index]})` }}><div><span className="eyebrow" style={{ color: "var(--cream)" }}>Explore</span><h3>{name}</h3></div></a>)}
        </div>
      </section>
      <section className="products-section" id="featured"><div className="container"><div className="section-heading"><div><span className="eyebrow">{productType === "ELITE" ? "Elite collection" : productType === "ESSENTIAL" ? "Essential collection" : "From our pantry"}</span><h2>{productType ? `${productType === "ELITE" ? "Elite" : "Essential"} products for your routine.` : "Made for every day."}</h2></div><a className="text-link" href="/shop">View all products →</a></div><div className="shop-toolbar"><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the D’FIT pantry" aria-label="Search products" /><select className="field" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select className="field" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products"><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></div>{error && <div className="form-message">{error}</div>}{renderProducts(4)}</div></section>
      <section className="values"><div className="container"><div className="section-heading"><div><span className="eyebrow">Why D’FIT</span><h2>Simple choices. Better habits.</h2></div></div><div className="value-grid">{[["01", "Quality ingredients", "Thoughtfully sourced ingredients you can feel good about."], ["02", "Everyday nutrition", "Wholesome products designed for real routines."], ["03", "Carefully crafted", "Small details make a difference in every batch."], ["04", "Trusted & transparent", "Clear information, honest pricing, no loud promises."]].map(([number, title, copy]) => <div className="value-item" key={title}><span className="eyebrow">{number}</span><p><strong>{title}</strong></p><p>{copy}</p></div>)}</div></div></section>
      <section className="story" id="story"><div className="container story-grid"><div><span className="eyebrow" style={{ color: "var(--cream-deep)" }}>Our story</span><h2>A little more goodness in the everyday.</h2><p>D’FIT Organic began with a simple belief: the food we reach for most often deserves the most care. We make familiar staples with clean ingredients, considered processes, and a deep respect for everyday wellness.</p><a className="button secondary" style={{ color: "var(--cream)", borderColor: "var(--cream)" }} href="/about">Meet D’FIT</a></div><div className="story-image" /></div></section>
        {!productType && <section className="story" id="story"><div className="container story-grid"><div><span className="eyebrow" style={{ color: "var(--cream-deep)" }}>Our story</span><h2>A little more goodness in the everyday.</h2><p>D’FIT Organic began with a simple belief: the food we reach for most often deserves the most care. We make familiar staples with clean ingredients, considered processes, and a deep respect for everyday wellness.</p><a className="button secondary" style={{ color: "var(--cream)", borderColor: "var(--cream)" }} href="/about">Meet D’FIT</a></div><div className="story-image" /></div></section>}
      <section className="newsletter"><span className="eyebrow">The D’FIT note</span><h2>Good things, occasionally.</h2><p>New products, pantry inspiration, and thoughtful wellness notes.</p><form className="newsletter-form" onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Your email address" aria-label="Email address" required /><button className="button" type="submit">Subscribe</button></form></section>
    </main>
  );
};

export default ProductList;
