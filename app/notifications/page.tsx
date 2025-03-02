"use client";

import React, { useState } from "react";

interface Notification {
  id: number;
  type: "success" | "info" | "warning" | "error";
  message: string;
  date: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      type: "success",
      message: "Your profile has been updated successfully.",
      date: "2025-03-01 10:00 AM",
    },
    {
      id: 2,
      type: "info",
      message: "New version of Translayte is available.",
      date: "2025-02-28 3:30 PM",
    },
    {
      id: 3,
      type: "warning",
      message: "Your subscription will renew in 3 days.",
      date: "2025-02-27 9:15 AM",
    },
    {
      id: 4,
      type: "error",
      message: "Failed to fetch some data. Please try again later.",
      date: "2025-02-26 5:45 PM",
    },
  ]);

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "success":
        return "#d4edda";
      case "info":
        return "#d1ecf1";
      case "warning":
        return "#fff3cd";
      case "error":
        return "#f8d7da";
      default:
        return "#fff";
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "#c3e6cb";
      case "info":
        return "#bee5eb";
      case "warning":
        return "#ffeeba";
      case "error":
        return "#f5c6cb";
      default:
        return "#ccc";
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Notifications</h1>
      <div style={styles.notificationsList}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              ...styles.notificationCard,
              backgroundColor: getBackgroundColor(notification.type),
              borderColor: getBorderColor(notification.type),
            }}
          >
            <p style={styles.message}>{notification.message}</p>
            <p style={styles.date}>{notification.date}</p>
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
  },
  heading: {
    fontSize: "2.5rem",
    textAlign: "center",
    marginBottom: "30px",
    color: "#333",
  },
  notificationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  notificationCard: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "15px",
  },
  message: {
    fontSize: "1rem",
    marginBottom: "5px",
    color: "#333",
  },
  date: {
    fontSize: "0.85rem",
    color: "#666",
  },
};

export default NotificationsPage;
