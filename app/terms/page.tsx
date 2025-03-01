"use client";

import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Terms of Service</h1>
      <p style={styles.paragraph}>Effective Date: January 1, 2025</p>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>1. Acceptance of Terms</h2>
        <p style={styles.paragraph}>
          By accessing or using Translayte, you agree to be bound by these Terms
          of Service. If you do not agree to these terms, please do not use our
          services.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>2. Description of Service</h2>
        <p style={styles.paragraph}>
          Translayte provides a platform for translating JSON-based keys for
          applications, including integration with React Native and other
          frameworks. We strive to offer a seamless and efficient translation
          management experience.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>3. User Obligations</h2>
        <p style={styles.paragraph}>
          You agree to use our services responsibly and in compliance with all
          applicable laws. You will not misuse or attempt to gain unauthorized
          access to any part of our system.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>4. Limitation of Liability</h2>
        <p style={styles.paragraph}>
          Translayte shall not be liable for any indirect, incidental, or
          consequential damages arising from your use of our services. Our total
          liability shall not exceed the amount you paid to use our services, if
          any.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>5. Changes to Terms</h2>
        <p style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Continued use
          of the service constitutes your acceptance of any changes.
        </p>
      </section>

      <p style={styles.paragraph}>
        If you have any questions about these Terms, please contact us at{" "}
        <a href="mailto:support@translayte.it" style={styles.link}>
          support@translayte.it
        </a>
        .
      </p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
    lineHeight: 1.6,
  },
  heading: {
    fontSize: "2.5rem",
    textAlign: "center",
    marginBottom: "20px",
  },
  subHeading: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    marginTop: "20px",
    color: "#007BFF",
  },
  paragraph: {
    fontSize: "1rem",
    marginBottom: "15px",
  },
  section: {
    marginBottom: "20px",
  },
  link: {
    color: "#007BFF",
    textDecoration: "none",
  },
};

export default TermsPage;
