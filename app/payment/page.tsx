"use client";

import React from "react";
import CheckoutButton from "../components/CheckoutButton"; // Ensure you have this component from your Stripe integration

const PaymentPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Upgrade to Premium</h1>
      <p style={styles.paragraph}>
        Choose the plan that best fits your needs and unlock advanced features!
      </p>
      <div style={styles.pricingContainer}>
        {/* Free Plan Card */}
        <div style={styles.planCard}>
          <h2 style={styles.planTitle}>Free Plan</h2>
          <p style={styles.planPrice}>$0 / month</p>
          <ul style={styles.planFeatures}>
            <li>Basic Translation</li>
            <li>Limited API Access</li>
          </ul>
          <button style={styles.disabledButton} disabled>
            Current Plan
          </button>
        </div>
        {/* Premium Plan Card */}
        <div style={styles.planCard}>
          <h2 style={styles.planTitle}>Premium Plan</h2>
          <p style={styles.planPrice}>$29 / month</p>
          <ul style={styles.planFeatures}>
            <li>All Free Features</li>
            <li>Bulk Translation</li>
            <li>Advanced API Access</li>
            <li>Priority Support</li>
          </ul>
          {/* CheckoutButton component calls your Stripe API endpoint */}
          <CheckoutButton />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "900px",
    margin: "0 auto",
    textAlign: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  heading: {
    fontSize: "2.5rem",
    marginBottom: "20px",
    color: "#333",
  },
  paragraph: {
    fontSize: "1rem",
    marginBottom: "40px",
    color: "#555",
  },
  pricingContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  planCard: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    width: "300px",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  planTitle: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    color: "#007BFF",
  },
  planPrice: {
    fontSize: "1.5rem",
    marginBottom: "20px",
    color: "#333",
  },
  planFeatures: {
    listStyleType: "none",
    padding: 0,
    marginBottom: "20px",
    color: "#555",
  },
  disabledButton: {
    padding: "12px 20px",
    backgroundColor: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "not-allowed",
  },
};

export default PaymentPage;
