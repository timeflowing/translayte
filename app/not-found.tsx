"use client";

import React from "react";
import Link from "next/link";

const NotFoundPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>404 - Page Not Found- Tuuudle nuuudle </h1>
      <p style={styles.text}>
        Oops! Taková smůla! We can&apos;t seem to find the page you&apos;re
        looking for.
      </p>
      <Link href="/">
        <text style={styles.link}>Skap</text>
      </Link>
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
    fontSize: "3rem",
    marginBottom: "20px",
    color: "#333",
  },
  text: {
    fontSize: "1.2rem",
    marginBottom: "30px",
    color: "#555",
  },
  link: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
  },
};

export default NotFoundPage;
