"use client";

import React, { useState } from "react";
import Link from "next/link";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the form submission logic here (e.g., call your API)
    console.log("Form submitted", { email, password });
  };

  return (
    <section id="signup" style={styles.signup}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Create Your Account</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.btnPrimary}>
            Sign Up
          </button>
        </form>
        <div style={styles.socialLogin}>
          <p style={styles.socialText}>Or sign up with:</p>
          <button style={{ ...styles.socialBtn, backgroundColor: "orange" }}>
            Google
          </button>
          <button style={{ ...styles.socialBtn, backgroundColor: "#333" }}>
            GitHub
          </button>
        </div>
        <p style={styles.loginLink}>
          Already have an account?{" "}
          <Link href="/login">
            <text style={styles.link}>Log In</text>
          </Link>
        </p>
      </div>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  signup: {
    padding: "60px 20px",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "40px",
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "30px",
    color: "#333",
  },
  form: {
    textAlign: "left",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  btnPrimary: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  socialLogin: {
    marginTop: "20px",
  },
  socialText: {
    marginBottom: "10px",
    color: "#555",
  },
  socialBtn: {
    padding: "10px 20px",
    margin: "0 5px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#fff",
  },
  loginLink: {
    marginTop: "20px",
    color: "#555",
  },
  link: {
    color: "#007BFF",
    textDecoration: "none",
  },
};

export default SignupPage;
