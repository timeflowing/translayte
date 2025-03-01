"use client";

import React from "react";

interface Integration {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
}

const integrations: Integration[] = [
  {
    id: 1,
    name: "Slack",
    description: "Receive real-time notifications directly in Slack.",
    iconUrl: "https://via.placeholder.com/80?text=Slack",
  },
  {
    id: 2,
    name: "Zapier",
    description: "Automate workflows with Zapier integrations.",
    iconUrl: "https://via.placeholder.com/80?text=Zapier",
  },
  {
    id: 3,
    name: "GitHub",
    description: "Integrate with GitHub for seamless code deployments.",
    iconUrl: "https://via.placeholder.com/80?text=GitHub",
  },
  {
    id: 4,
    name: "Google Sheets",
    description: "Export your data to Google Sheets effortlessly.",
    iconUrl: "https://via.placeholder.com/80?text=Sheets",
  },
];

const IntegrationsPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Integrations</h1>
      <p style={styles.subHeading}>
        Enhance your workflow with our powerful integrations.
      </p>
      <div style={styles.grid}>
        {integrations.map((integration) => (
          <div key={integration.id} style={styles.card}>
            <img
              src={integration.iconUrl}
              alt={integration.name}
              style={styles.icon}
            />
            <h2 style={styles.cardTitle}>{integration.name}</h2>
            <p style={styles.cardDescription}>{integration.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textAlign: "center",
  },
  heading: {
    fontSize: "2.5rem",
    marginBottom: "10px",
    color: "#333",
  },
  subHeading: {
    fontSize: "1.2rem",
    marginBottom: "30px",
    color: "#555",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  card: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
  },
  icon: {
    width: "80px",
    height: "80px",
    marginBottom: "10px",
  },
  cardTitle: {
    fontSize: "1.5rem",
    marginBottom: "10px",
    color: "#007BFF",
  },
  cardDescription: {
    fontSize: "1rem",
    color: "#555",
  },
};

export default IntegrationsPage;
