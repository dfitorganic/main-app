import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { authFetch, getAccessToken } from "../utils/auth";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASEURL}/api/products/${id}/`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch product");
        }
        setProduct(data);
        document.title = `${data.name} | D'FIT Organic`;
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [BASEURL, id]);

  const handleAddToCart = async () => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    const success = await addToCart(product.id, quantity);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1500);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }
    setReviewMessage("");
    const response = await authFetch(`${BASEURL}/api/products/${product.id}/reviews/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setReviewMessage(data.error || "Unable to submit your review.");
      return;
    }
    setProduct((current) => ({ ...current, reviews: [data, ...(current.reviews || [])], review_count: (current.review_count || 0) + 1 }));
    setReviewForm({ rating: 5, title: "", comment: "" });
    setReviewMessage("Thank you for your review.");
  };

  if (loading) {
    return <div className="min-h-screen pt-28 px-6">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-28 px-6">
        <p className="text-red-600">{error || "Product not found"}</p>
        <Link to="/" className="text-orange-600 font-medium">
          Back to catalog
        </Link>
      </div>
    );
  }

  const imageSrc = product.image || "https://via.placeholder.com/600x600?text=Product";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-orange-500 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 bg-gray-50 p-8">
              <div className="img-zoom-container rounded-2xl overflow-hidden bg-white shadow-inner">
                <img src={imageSrc} alt={product.name} className="img-zoom w-full h-80 lg:h-[450px] object-cover" />
              </div>
            </div>

            <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">
              <p className="text-sm uppercase text-gray-400 mb-2">{product.category?.name || "General"}</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
              <p className="text-gray-600 mb-6 leading-relaxed">{product.description || "No description available."}</p>

              <div className="bg-orange-50 rounded-2xl p-6 mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="price">₹{Number(product.price).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn" type="button">
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="qty-btn" type="button">
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all ${
                  addedToCart ? "bg-green-500 text-white" : "btn-primary"
                }`}
              >
                {addedToCart ? "Added to cart" : "Add to cart"}
              </button>
            </div>
          </div>
        </div>

        <section className="mt-8 bg-white shadow-xl rounded-3xl p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6"><div><p className="eyebrow">Customer feedback</p><h2 className="text-2xl font-bold text-gray-800">Reviews {product.review_count ? `(${product.review_count})` : ""}</h2></div>{product.average_rating > 0 && <strong className="price">{product.average_rating}/5</strong>}</div>
          {product.reviews?.length ? <div className="space-y-4">{product.reviews.map((review) => <article className="border-b border-gray-100 pb-4" key={review.id}><div className="flex justify-between gap-4"><strong className="text-gray-800">{review.title || "Verified purchase"}</strong><span className="text-orange-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p className="text-gray-600 mt-1">{review.comment}</p><small className="text-gray-400">{review.author_name} · {new Date(review.created_at).toLocaleDateString("en-IN")}</small></article>)}</div> : <p className="text-gray-500">No reviews yet. Be the first to share your experience.</p>}
          <form className="mt-8 grid gap-4" onSubmit={handleReviewSubmit}><h3 className="font-semibold text-gray-800">Review this product</h3><select className="field" value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input className="field" value={reviewForm.title} onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })} placeholder="Review title (optional)" /><textarea className="field" value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Share your experience" required /><button className="button" type="submit">Submit review</button>{reviewMessage && <p className="form-message">{reviewMessage}</p>}</form>
        </section>
      </div>
    </div>
  );
}

export default ProductDetails;
