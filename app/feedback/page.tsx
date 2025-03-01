"use client";

import React, { useState } from "react";

const FeedbackPage: React.FC = () => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Replace this with your actual API call to save feedback
    console.log("Feedback submitted", { rating, feedback });
    setSubmitted(true);
    setFeedback("");
    setRating(0);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>We Value Your Feedback</h1>
      {submitted && <p style={styles.success}>Thank you for your feedback!</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="rating" style={styles.label}>
          Rating (1-5):
        </label>
        <input
          type="number"
          id="rating"
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
          min="1"
          max="5"
          style={styles.input}
          required
        />
        <label htmlFor="feedback" style={styles.label}>
          Your Feedback:
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what you think..."
          style={styles.textarea}
          required
        />
        <button type="submit" style={styles.button}>
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  heading: {
    fontSize: "2.5rem",
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  success: {
    textAlign: "center",
    color: "green",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  label: {
    fontSize: "1rem",
    marginBottom: "5px",
    color: "#555",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
    minHeight: "100px",
  },
  button: {
    padding: "12px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default FeedbackPage;
