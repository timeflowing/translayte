"use client";

import React from "react";

const DocumentationPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Developer Documentation</h1>
      <p style={styles.paragraph}>
        Welcome to the Translayte API documentation. Below you'll find a list of
        our endpoints along with example requests to help you integrate
        seamlessly.
      </p>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>Endpoints</h2>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <code style={styles.code}>GET /api/translate</code>: Retrieve
            translation data.
          </li>
          <li style={styles.listItem}>
            <code style={styles.code}>POST /api/translate</code>: Submit data
            for translation.
          </li>
          <li style={styles.listItem}>
            <code style={styles.code}>GET /api/projects</code>: Retrieve a list
            of projects.
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>Example Request</h2>
        <pre style={styles.codeBlock}>
          {`fetch("https://api.translayte.it/api/translate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  body: JSON.stringify({ key: "hello", language: "es" })
})
.then(response => response.json())
.then(data => console.log(data));
`}
        </pre>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>Error Handling</h2>
        <p style={styles.paragraph}>
          All endpoints return standard HTTP status codes. In case of errors, a
          JSON response with an <code style={styles.code}>error</code> field
          will be provided.
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
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  heading: {
    fontSize: "2.5rem",
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  paragraph: {
    fontSize: "1rem",
    marginBottom: "15px",
    color: "#555",
  },
  section: {
    marginBottom: "30px",
  },
  subHeading: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    color: "#007BFF",
  },
  list: {
    listStyleType: "disc",
    paddingLeft: "20px",
    color: "#555",
  },
  listItem: {
    marginBottom: "10px",
  },
  code: {
    backgroundColor: "#f5f5f5",
    padding: "2px 4px",
    borderRadius: "3px",
    fontFamily: "monospace",
    fontSize: "0.95rem",
  },
  codeBlock: {
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "5px",
    fontFamily: "monospace",
    fontSize: "0.95rem",
    overflowX: "auto",
  },
};

export default DocumentationPage;
