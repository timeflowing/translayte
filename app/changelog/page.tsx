"use client";

import React, { useState } from "react";

interface ChangelogItem {
  version: string;
  date: string;
  changes: string[];
}

const dummyChangelog: ChangelogItem[] = [
  {
    version: "1.2.0",
    date: "2025-02-25",
    changes: [
      "Added bulk translation feature",
      "Improved API performance",
      "Fixed minor UI bugs",
    ],
  },
  {
    version: "1.1.0",
    date: "2025-01-15",
    changes: [
      "Launched billing and subscription features",
      "Improved dashboard layout",
      "Enhanced support section",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-01-01",
    changes: [
      "Initial release of Translayte",
      "Basic translation and API integration",
    ],
  },
];

const ChangelogPage: React.FC = () => {
  const [changelog] = useState<ChangelogItem[]>(dummyChangelog);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Changelog</h1>
      {changelog.map((item, index) => (
        <div key={index} style={styles.card}>
          <h2 style={styles.version}>Version {item.version}</h2>
          <p style={styles.date}>Released on: {item.date}</p>
          <ul style={styles.list}>
            {item.changes.map((change, idx) => (
              <li key={idx} style={styles.listItem}>
                {change}
              </li>
            ))}
          </ul>
        </div>
      ))}
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
    marginBottom: "20px",
    textAlign: "center",
    color: "#333",
  },
  card: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
    marginBottom: "20px",
  },
  version: {
    fontSize: "1.8rem",
    marginBottom: "5px",
    color: "#007BFF",
  },
  date: {
    fontSize: "0.9rem",
    marginBottom: "10px",
    color: "#888",
  },
  list: {
    listStyle: "disc",
    paddingLeft: "20px",
  },
  listItem: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "5px",
  },
};

export default ChangelogPage;
