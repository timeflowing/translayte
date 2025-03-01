"use client";

import React from "react";

const StatusPage: React.FC = () => {
  // Dummy status data; replace with real data if available
  const services = [
    {
      id: 1,
      name: "API",
      status: "Operational",
      description: "All endpoints are functioning normally.",
    },
    {
      id: 2,
      name: "Database",
      status: "Operational",
      description: "Data connectivity is stable.",
    },
    {
      id: 3,
      name: "Authentication",
      status: "Degraded",
      description: "Some delays observed in login response times.",
    },
    {
      id: 4,
      name: "Billing",
      status: "Maintenance",
      description: "Scheduled maintenance in progress.",
    },
  ];

  const getColor = (status: string) => {
    switch (status) {
      case "Operational":
        return "#28a745"; // green
      case "Degraded":
        return "#ffc107"; // yellow/orange
      case "Maintenance":
        return "#dc3545"; // red
      default:
        return "#6c757d"; // grey
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>System Status</h1>
      <div style={styles.servicesList}>
        {services.map((service) => (
          <div key={service.id} style={styles.serviceCard}>
            <div style={styles.serviceHeader}>
              <span
                style={{
                  ...styles.statusIndicator,
                  backgroundColor: getColor(service.status),
                }}
              ></span>
              <h2 style={styles.serviceName}>{service.name}</h2>
            </div>
            <p style={styles.serviceStatus}>Status: {service.status}</p>
            <p style={styles.serviceDescription}>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textAlign: "center",
  },
  heading: {
    fontSize: "2.5rem",
    marginBottom: "30px",
    color: "#333",
  },
  servicesList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  serviceCard: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
    textAlign: "left",
  },
  serviceHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
  },
  statusIndicator: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "10px",
  },
  serviceName: {
    fontSize: "1.5rem",
    margin: 0,
    color: "#007BFF",
  },
  serviceStatus: {
    fontSize: "1rem",
    margin: "5px 0",
    color: "#555",
  },
  serviceDescription: {
    fontSize: "0.9rem",
    color: "#888",
  },
};

export default StatusPage;
