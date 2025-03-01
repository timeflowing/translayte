"use client";

import React, { useState } from "react";

interface BillingItem {
  date: string;
  amount: string;
  status: string;
}

const BillingPage: React.FC = () => {
  // Replace these dummy values with real data from your backend
  const [subscription] = useState("Premium");
  const [billingHistory] = useState<BillingItem[]>([
    { date: "2025-02-01", amount: "$29", status: "Paid" },
    { date: "2025-01-01", amount: "$29", status: "Paid" },
    { date: "2024-12-01", amount: "$29", status: "Paid" },
  ]);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Billing & Payment</h1>

      <section style={styles.subscriptionSection}>
        <h2 style={styles.subHeading}>Current Subscription</h2>
        <p style={styles.subscriptionText}>Plan: {subscription}</p>
        <button style={styles.updateBtn}>Update Payment Method</button>
      </section>

      <section style={styles.historySection}>
        <h2 style={styles.subHeading}>Billing History</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Date</th>
              <th style={styles.tableHeader}>Amount</th>
              <th style={styles.tableHeader}>Status</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((item, index) => (
              <tr key={index}>
                <td style={styles.tableCell}>{item.date}</td>
                <td style={styles.tableCell}>{item.amount}</td>
                <td style={styles.tableCell}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    fontSize: "2rem",
    marginBottom: "20px",
    textAlign: "center",
    color: "#333",
  },
  subscriptionSection: {
    marginBottom: "40px",
    textAlign: "center",
  },
  subHeading: {
    fontSize: "1.5rem",
    marginBottom: "10px",
    color: "#333",
  },
  subscriptionText: {
    fontSize: "1.2rem",
    marginBottom: "10px",
    color: "#555",
  },
  updateBtn: {
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  historySection: {
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    borderBottom: "2px solid #eaeaea",
    padding: "10px",
    textAlign: "left",
    color: "#333",
  },
  tableCell: {
    borderBottom: "1px solid #eaeaea",
    padding: "10px",
    color: "#555",
  },
};

export default BillingPage;
