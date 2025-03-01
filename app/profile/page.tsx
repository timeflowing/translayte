"use client";

import React, { useState } from "react";

const ProfilePage: React.FC = () => {
  // Dummy user data; replace with data fetched from your backend
  const [name, setName] = useState("Alice");
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate an update request to your backend
    console.log("Profile updated", { name, email, password });
    setUpdateStatus("Profile updated successfully!");
    // Clear the password field after update
    setPassword("");
    setTimeout(() => setUpdateStatus(""), 3000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Profile Settings</h1>
      {updateStatus && <p style={styles.status}>{updateStatus}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="name" style={styles.label}>
            Name:
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>
            New Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep unchanged"
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.btnPrimary}>
          Update Profile
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
  status: {
    textAlign: "center",
    color: "green",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontSize: "1rem",
    color: "#555",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  btnPrimary: {
    padding: "12px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default ProfilePage;
