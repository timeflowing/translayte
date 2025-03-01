"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <header className="navbar">
        <div className="logo">Translayte</div>
        <nav>
          {/* <a href="#features">Features</a> */}
          <Link href="/blog">Blog</Link>
          <Link href="/dashboard">Dashboard Demo</Link>
          <Link href="/pricing">Pricing</Link>
          {/* <a href="#resources">Resources</a> */}
          {/* <a href="#contact">Contact</a> */}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>Effortless JSON Translation for React Native & Beyond</h1>
          <p>
            Save time and reduce errors with our intuitive translation tool.
          </p>
          <Link href="/translator" className="btn-primary">
            Get Started for Free
          </Link>
        </div>
        <div className="hero-video">
          {/* Real image representing a coding/demo environment */}
          <img
            src="https://source.unsplash.com/400x300/?programming"
            alt="Demo of Coding Environment"
          />
        </div>
      </section>

      {/* Social Proof & Features */}
      <section id="features" className="features">
        <h2>Why Developers Love Translayte</h2>
        <div className="feature-cards">
          <div className="card">
            <img
              src="https://source.unsplash.com/60x60/?api,technology"
              alt="API Integration"
            />
            <h3>API Integration</h3>
            <p>Integrate seamlessly with your existing workflow.</p>
          </div>
          <div className="card">
            <img
              src="https://source.unsplash.com/60x60/?translation,code"
              alt="Bulk Translation"
            />
            <h3>Bulk Translation</h3>
            <p>Translate large sets of keys effortlessly.</p>
          </div>
          {/* You can add more feature cards with similar structure */}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <Link href="/terms">Terms and conditions</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/feedback">Feedback</Link>
          <Link href="/integration">Integration</Link>
          <Link href="/apidocumentation">Api documentation</Link>
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/status">Status</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="footer-social">
          {/* External links can use regular anchor tags */}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
        <p>&copy; 2025 Translayte. All Rights Reserved.</p>
      </footer>
    </>
  );
}
