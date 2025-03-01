"use client";

import React, { useState } from "react";

interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  estimatedDate: string;
}

const dummyRoadmap: RoadmapItem[] = [
  {
    id: 1,
    title: "Real-Time Collaboration",
    description: "Enable multiple users to edit translations simultaneously.",
    estimatedDate: "Q2 2025",
  },
  {
    id: 2,
    title: "Advanced Analytics Dashboard",
    description:
      "Provide detailed insights into translation usage and performance.",
    estimatedDate: "Q3 2025",
  },
  {
    id: 3,
    title: "Machine Learning Integration",
    description: "Automate translation suggestions with AI-powered insights.",
    estimatedDate: "Q4 2025",
  },
];

const RoadmapPage: React.FC = () => {
  const [roadmap] = useState<RoadmapItem[]>(dummyRoadmap);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Product Roadmap</h1>
      <p style={styles.subHeading}>
        Upcoming Features and Improvements for Translayte
      </p>
      <div style={styles.roadmapList}>
        {roadmap.map((item) => (
          <div key={item.id} style={styles.card}>
            <h2 style={styles.cardTitle}>{item.title}</h2>
            <p style={styles.cardDescription}>{item.description}</p>
            <p style={styles.estimatedDate}>
              Estimated Release: {item.estimatedDate}
            </p>
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
    marginBottom: "10px",
    color: "#333",
  },
  subHeading: {
    fontSize: "1.2rem",
    marginBottom: "30px",
    color: "#555",
  },
  roadmapList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
    textAlign: "left",
  },
  cardTitle: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    color: "#007BFF",
  },
  cardDescription: {
    fontSize: "1rem",
    marginBottom: "10px",
    color: "#555",
  },
  estimatedDate: {
    fontSize: "0.9rem",
    color: "#888",
  },
};

export default RoadmapPage;
