"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// Load Stripe using your publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

const DonatePage: React.FC = () => {
  const [donationAmount, setDonationAmount] = useState<string>("10"); // default $10
  const [status, setStatus] = useState<string>("");

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Processing donation...");
    try {
      // Call the donation API endpoint with the donation amount (in dollars)
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationAmount: parseFloat(donationAmount) }),
      });
      const data = await res.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (error) {
          console.error("Stripe redirect error:", error);
          setStatus("Failed to redirect to checkout.");
        }
      }
    } catch (error) {
      console.error("Donation error:", error);
      setStatus("An error occurred while processing your donation.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Support Translayte</h1>
      <p style={styles.paragraph}>
        If you enjoy using Translayte, consider making a donation to help us
        improve and maintain the service.
      </p>
      <form onSubmit={handleDonate} style={styles.form}>
        <label htmlFor="donation" style={styles.label}>
          Donation Amount (USD):
        </label>
        <input
          type="number"
          id="donation"
          min="1"
          step="1"
          value={donationAmount}
          onChange={(e) => setDonationAmount(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Donate Now
        </button>
      </form>
      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "600px",
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
    marginBottom: "30px",
    color: "#555",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    alignItems: "center",
  },
  label: {
    fontSize: "1rem",
    color: "#555",
  },
  input: {
    padding: "10px",
    fontSize: "1rem",
    width: "200px",
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "12px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  status: {
    marginTop: "20px",
    fontSize: "1rem",
    color: "#28a745",
  },
};

export default DonatePage;
