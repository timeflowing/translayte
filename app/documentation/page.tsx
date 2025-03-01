"use client";

import React, { useState } from "react";

const ApiAccessPage: React.FC = () => {
  // In a real app, fetch this value from your backend or context
  const [apiKey] = useState("1234-5678-ABCD-EFGH");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>API Access</h1>
      <p style={styles.text}>Your API Key:</p>
      <div style={styles.apiKeyContainer}>
        <code style={styles.apiKey}>{apiKey}</code>
        <button onClick={handleCopy} style={styles.copyBtn}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <section style={styles.documentation}>
        <h2 style={styles.subHeading}>How to Use the API</h2>
        <p style={styles.text}>
          Use the API key above to authenticate your requests. Include it in the
          headers of your requests:
        </p>
        <pre style={styles.codeBlock}>
          {`fetch("https://api.translayte.it/translate", {
  headers: {
    "Authorization": "Bearer ${apiKey}"
  }
});`}
        </pre>
        <p style={styles.text}>
          Check out our full documentation for more details on endpoints,
          request formats, and usage limits.
        </p>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "20px",
    textAlign: "center",
  },
  text: {
    fontSize: "1rem",
    marginBottom: "10px",
    color: "#555",
  },
  apiKeyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    border: "1px solid #eaeaea",
    borderRadius: "4px",
    padding: "10px 20px",
    marginBottom: "20px",
  },
  apiKey: {
    fontSize: "1.2rem",
    marginRight: "10px",
  },
  copyBtn: {
    padding: "8px 12px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  documentation: {
    backgroundColor: "#fff",
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
  },
  subHeading: {
    fontSize: "1.5rem",
    marginBottom: "10px",
  },
  codeBlock: {
    backgroundColor: "#f5f5f5",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "0.9rem",
    overflowX: "auto",
    marginBottom: "10px",
  },
};

export default ApiAccessPage;
