"use client";

import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>About Translayte</h1>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>Our Story</h2>
        <p style={styles.text}>
          Translayte was born out of the need for a simple, efficient solution
          to app localization. Frustrated by the complexity and time-consuming
          process of managing translation keys across multiple platforms, our
          founder set out to build a tool that streamlines the entire
          workflow—allowing developers to focus on creating great apps.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>Our Mission</h2>
        <p style={styles.text}>
          Our mission is to empower developers by making translation and
          localization effortless. We aim to remove the friction of language
          barriers and help creators launch truly global applications with ease.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>Meet the Team</h2>
        <div style={styles.teamContainer}>
          <div style={styles.teamMember}>
            <img
              src="https://source.unsplash.com/100x100/?face,portrait"
              alt="Alice, Founder & Developer"
              style={styles.teamImage}
            />
            <h3 style={styles.teamName}>Alice</h3>
            <p style={styles.teamRole}>Founder & Developer</p>
          </div>
          <div style={styles.teamMember}>
            <img
              src="https://source.unsplash.com/100x100/?face,professional"
              alt="Bob, Marketing Specialist"
              style={styles.teamImage}
            />
            <h3 style={styles.teamName}>Bob</h3>
            <p style={styles.teamRole}>Marketing Specialist</p>
          </div>
          <div style={styles.teamMember}>
            <img
              src="https://source.unsplash.com/100x100/?face,smile"
              alt="Carol, Customer Support"
              style={styles.teamImage}
            />
            <h3 style={styles.teamName}>Carol</h3>
            <p style={styles.teamRole}>Customer Support</p>
          </div>
        </div>
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
  section: {
    marginBottom: "40px",
  },
  subHeading: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    color: "#007BFF",
  },
  text: {
    fontSize: "1rem",
    color: "#555",
    lineHeight: 1.6,
  },
  teamContainer: {
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: "20px",
    marginTop: "20px",
  },
  teamMember: {
    textAlign: "center",
  },
  teamImage: {
    borderRadius: "50%",
    width: "100px",
    height: "100px",
    objectFit: "cover",
    marginBottom: "10px",
  },
  teamName: {
    fontSize: "1.2rem",
    margin: "0",
  },
  teamRole: {
    fontSize: "1rem",
    color: "#777",
  },
};

export default AboutPage;
