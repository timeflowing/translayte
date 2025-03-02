"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  date: string;
}

const dummyArticles: Article[] = [
  {
    id: 1,
    title: "How to Translate JSON Keys in React Native",
    excerpt:
      "Learn how to streamline your app localization workflow using Translayte and improve your development efficiency.",
    date: "2025-02-25",
  },
  {
    id: 2,
    title: "Best Practices for App Localization",
    excerpt:
      "Discover the best practices for managing translations and ensuring a seamless multilingual experience in your app.",
    date: "2025-01-15",
  },
  {
    id: 3,
    title: "Integrating Translayte API in Your Projects",
    excerpt:
      "A comprehensive guide on integrating our API into your development workflow for automated translation management.",
    date: "2025-01-01",
  },
];

const ResourcesPage: React.FC = () => {
  const [articles] = useState<Article[]>(dummyArticles);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Resources & Blog</h1>
      <div style={styles.articlesList}>
        {articles.map((article) => (
          <div key={article.id} style={styles.articleCard}>
            <h2 style={styles.articleTitle}>{article.title}</h2>
            <p style={styles.articleExcerpt}>{article.excerpt}</p>
            <p style={styles.articleDate}>Published on: {article.date}</p>
            <Link href={`/resources/${article.id}`}>
              <text style={styles.readMore}>Read More</text>
            </Link>
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
    marginBottom: "20px",
    textAlign: "center",
    color: "#333",
  },
  articlesList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  articleCard: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
  },
  articleTitle: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    color: "#007BFF",
  },
  articleExcerpt: {
    fontSize: "1rem",
    marginBottom: "10px",
    color: "#555",
  },
  articleDate: {
    fontSize: "0.9rem",
    marginBottom: "10px",
    color: "#888",
  },
  readMore: {
    display: "inline-block",
    padding: "8px 16px",
    backgroundColor: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
  },
};

export default ResourcesPage;
