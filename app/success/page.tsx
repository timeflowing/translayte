"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const DonateSuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Thank You for Your Support!</h1>
      <div style={styles.successIcon}>✓</div>
      <p style={styles.paragraph}>
        Your donation has been successfully processed. We appreciate your
        contribution to Translayte.
      </p>
      <p style={styles.sessionId}>
        Transaction ID: {sessionId ? sessionId.substring(0, 12) + "..." : ""}
      </p>
      <div style={styles.navigation}>
        <Link href="/" style={styles.homeLink}>
          Return to Homepage
        </Link>
      </div>
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
  successIcon: {
    fontSize: "5rem",
    color: "#4CAF50",
    marginBottom: "20px",
  },
  paragraph: {
    fontSize: "1.2rem",
    marginBottom: "20px",
    color: "#555",
  },
  sessionId: {
    fontSize: "0.9rem",
    color: "#888",
    marginBottom: "30px",
  },
  navigation: {
    marginTop: "30px",
  },
  homeLink: {
    display: "inline-block",
    padding: "12px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
    fontSize: "1rem",
  },
};

export default DonateSuccessPage;
