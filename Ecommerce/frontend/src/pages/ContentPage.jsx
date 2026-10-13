const pageCopy = {
  about: { eyebrow: "The D’FIT story", title: "Goodness for the everyday.", body: "D’FIT Organic is a premium pantry brand built around a simple idea: the foods we choose most often deserve thoughtful ingredients and careful craft. From nourishing ghee to everyday blends, we make familiar staples feel a little more considered." },
  contact: { eyebrow: "We would love to hear from you", title: "Let’s keep in touch.", body: "For product questions, order support, or a hello from your kitchen, write to hello@dfitorganic.com. Our team responds Monday through Friday, 10am to 6pm IST." },
  privacy: { eyebrow: "Your privacy matters", title: "Privacy policy", body: "We use your information to process orders, support your account, and improve the D’FIT experience. We do not sell personal information. Payment details are handled by secure payment providers and are never stored by D’FIT." },
  terms: { eyebrow: "The essentials", title: "Terms & conditions", body: "By using this website, you agree to provide accurate account information and use D’FIT products and services lawfully. Product availability, pricing, and delivery estimates may change as we keep our catalogue current." },
  refund: { eyebrow: "Here to help", title: "Refund policy", body: "If your order arrives damaged or incorrect, contact us within 48 hours with your order number and photographs. We will review the issue and arrange a replacement or refund where appropriate." },
};

const ContentPage = ({ type }) => {
  const content = pageCopy[type] || pageCopy.about;
  return <main className="content-page page"><div className="container"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.body}</p>{type === "contact" ? <><h2>Contact options</h2><p>Email: hello@dfitorganic.com</p><p>Phone: +91 98765 43210</p><p>Hours: Monday to Friday, 10am to 6pm IST</p><p>Address: D’FIT Organic, Bengaluru, India</p></> : <><h2>Thoughtfully made, clearly communicated.</h2><p>We believe trust is built through useful information, responsive service, and products that earn a place in your routine.</p></>}</div></main>;
};

export default ContentPage;
