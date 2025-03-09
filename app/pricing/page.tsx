"use client";

import React from "react";
import Link from "next/link";

const PricingPage: React.FC = () => {
  return (
    <section id="pricing" style={styles.pricing}>
      <h2 style={styles.heading}>Choose Your Plan</h2>
      <div style={styles.pricingContainer}>
        {/* Free Tier */}
        <div style={styles.pricingCard}>
          <h3 style={styles.cardHeading}>Free</h3>
          <p style={styles.price}>$0/month</p>
          <ul style={styles.list}>
            <li>Basic Translation Features</li>
            <li>Limited API Requests</li>
            <li>Email Support</li>
          </ul>
          <Link href="/signup">Get Started</Link>
        </div>
      </div>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pricing: {
    padding: "60px 20px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
  },
  heading: {
    fontSize: "2.5rem",
    marginBottom: "40px",
    color: "#333",
  },
  pricingContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "20px",
  },
  pricingCard: {
    background: "#fff",
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "30px",
    width: "300px",
    position: "relative",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  cardHeading: {
    fontSize: "1.8rem",
    marginBottom: "10px",
  },
  price: {
    fontSize: "1.5rem",
    marginBottom: "20px",
    color: "#007BFF",
  },
  list: {
    listStyle: "none",
    textAlign: "left",
    marginBottom: "30px",
    padding: 0,
  },
  btnPrimary: {
    textDecoration: "none",
    background: "#007BFF",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "5px",
    display: "inline-block",
  },
  featuredCard: {
    backgroundColor: "#e9f5ff",
    border: "2px solid #007BFF",
  },
  badge: {
    backgroundColor: "#ffc107",
    color: "#fff",
    padding: "5px 10px",
    position: "absolute",
    top: "-15px",
    right: "-15px",
    borderRadius: "50px",
    fontSize: "0.9rem",
  },
};

export default PricingPage;
