import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  const imageSrc = product.image || product.gallery?.[0]?.image || "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=80";

  return (
    <Link to={`/product/${product.slug || product.id}`} className="product-card">
      <div className="product-image">
        <img src={imageSrc} alt={product.name} loading="lazy" />
      </div>
      <div className="product-info">
        <span className="product-category">{product.category?.name || "Organic pantry"}</span>
        <h3>{product.name}</h3>
        <div className="product-meta">
          <span className="price">₹{Number(product.price).toLocaleString("en-IN")}</span>
          {product.original_price && Number(product.original_price) > Number(product.price) && <span className="old-price">₹{Number(product.original_price).toLocaleString("en-IN")}</span>}
        </div>
        <span className="text-link" style={{ display: "block", marginTop: 9, fontSize: 11 }}>{product.in_stock === false ? "Currently unavailable" : "Made for everyday wellness"}</span>
        <span className="button">View product</span>
      </div>
    </Link>
  );
};

export default ProductCard;
