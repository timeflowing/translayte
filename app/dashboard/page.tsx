"use client";

import React from "react";
import Link from "next/link";

const DashboardPage: React.FC = () => {
  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Translayte</h2>
        <nav>
          <ul style={styles.navList}>
            <li>
              <Link href="/dashboard">
                <text style={styles.navLink}>Dashboard</text>
              </Link>
            </li>
            <li>
              <Link href="/projects">
                <span style={styles.navLink}>Projects</span>
              </Link>
            </li>
            <li>
              <Link href="/documentation">
                <text style={styles.navLink}>API Access</text>
              </Link>
            </li>
            <li>
              <Link href="/billing">
                <text style={styles.navLink}>Billing</text>
              </Link>
            </li>
            <li>
              <Link href="/support">
                <text style={styles.navLink}>Support</text>
              </Link>
            </li>
            <li>
              <Link href="/profile">
                <text style={styles.navLink}>Profil</text>
              </Link>
            </li>
            <li>
              <Link href="/notifications">
                <text style={styles.navLink}>Notifications</text>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <main style={styles.mainContent}>
        <h1>Welcome, [User Name]</h1>
        <p>
          Here&apos;s an overview of your translation projects and usage stats.
        </p>
        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>Total Projects</h3>
            <p>5</p>
          </div>
          <div style={styles.card}>
            <h3>Translations This Month</h3>
            <p>1,200 keys</p>
          </div>
          <div style={styles.card}>
            <h3>API Usage</h3>
            <p>3,500 calls</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  dashboardContainer: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#f5faff",
    padding: "20px",
    borderRight: "1px solid #eaeaea",
  },
  sidebarTitle: {
    fontSize: "1.8rem",
    marginBottom: "20px",
    color: "#007BFF",
  },
  navList: {
    listStyle: "none",
    padding: 0,
  },
  navLink: {
    display: "block",
    padding: "10px 0",
    color: "#333",
    textDecoration: "none",
    fontSize: "1.1rem",
  },
  mainContent: {
    flex: 1,
    padding: "40px",
  },
  cardContainer: {
    display: "flex",
    gap: "20px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  card: {
    flex: "1 1 250px",
    backgroundColor: "#fff",
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
  },
};

export default DashboardPage;
