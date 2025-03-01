"use client";

import React from "react";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Privacy Policy</h1>
      <p style={styles.paragraph}>Effective Date: January 1, 2025</p>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>1. Information Collection</h2>
        <p style={styles.paragraph}>
          We collect various types of information when you use our services,
          including but not limited to personal details such as your name, email
          address, and usage data. This information helps us provide and improve
          our services.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>2. Use of Information</h2>
        <p style={styles.paragraph}>
          The information we collect is used to deliver our services,
          personalize your experience, and enhance the security of our platform.
          We may also use your data to communicate updates and promotional
          offers, though you can opt out at any time.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>3. Sharing of Information</h2>
        <p style={styles.paragraph}>
          We do not sell or share your personal information with third parties
          except as required by law or when necessary to protect our rights and
          safety. In cases where we work with trusted partners, we ensure that
          your data is handled securely.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>4. Data Security</h2>
        <p style={styles.paragraph}>
          We implement a variety of security measures to protect your personal
          information from unauthorized access, disclosure, alteration, or
          destruction.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>5. Changes to This Privacy Policy</h2>
        <p style={styles.paragraph}>
          We reserve the right to modify this Privacy Policy at any time. Any
          changes will be posted on this page with an updated effective date.
          Continued use of our services indicates your acceptance of the revised
          terms.
        </p>
      </section>

      <p style={styles.paragraph}>
        If you have any questions about this Privacy Policy, please contact us
        at{" "}
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
    marginTop: "20px",
    marginBottom: "10px",
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

export default PrivacyPolicyPage;
