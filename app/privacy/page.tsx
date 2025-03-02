"use client";

import React from "react";
import Link from "next/link";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Privacy Policy</h1>
      <p style={styles.paragraph}>Effective Date: January 1, 2025</p>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>1. Controller of Personal Data</h2>
        <p style={styles.paragraph}>
          Translayte, operated by Vojtěch Tomášek, is the data controller for
          your personal information. For any inquiries regarding your data,
          please contact us at{" "}
          <a href="mailto:support@translayte.it" style={styles.link}>
            support@translayte.it
          </a>
          .
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>2. Purpose of Data Processing</h2>
        <p style={styles.paragraph}>We collect and process personal data to:</p>
        <ul style={styles.list}>
          <li>Provide and improve our Service.</li>
          <li>Manage your account and process payments.</li>
          <li>
            Communicate with you regarding updates, promotions, and support.
          </li>
          <li>Comply with legal obligations.</li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>3. Types of Data Collected</h2>
        <p style={styles.paragraph}>
          We may collect the following types of personal data:
        </p>
        <ul style={styles.list}>
          <li>
            <strong>Contact Information:</strong> Name, email address, phone
            number.
          </li>
          <li>
            <strong>Account Information:</strong> Username, password, and other
            details provided during registration.
          </li>
          <li>
            <strong>Transactional Data:</strong> Payment information and billing
            details.
          </li>
          <li>
            <strong>Usage Data:</strong> Information on how you use our Service,
            including device and browser information.
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>4. Legal Basis for Processing</h2>
        <p style={styles.paragraph}>We process your personal data based on:</p>
        <ul style={styles.list}>
          <li>Your consent.</li>
          <li>The necessity to perform a contract with you.</li>
          <li>Our legitimate interests in improving our Service.</li>
          <li>Compliance with legal obligations.</li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>5. Sharing of Personal Data</h2>
        <p style={styles.paragraph}>Your personal data may be shared with:</p>
        <ul style={styles.list}>
          <li>
            Third-party service providers who assist in operating our Service
            (e.g., IT services, payment processing).
          </li>
          <li>Legal authorities when required by law.</li>
        </ul>
        <p style={styles.paragraph}>
          All such transfers are subject to strict contractual obligations to
          ensure the security of your data.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>6. Data Retention</h2>
        <p style={styles.paragraph}>
          We retain your personal data only as long as necessary to fulfill the
          purposes outlined in this policy or as required by applicable laws.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>7. Your Rights</h2>
        <p style={styles.paragraph}>You have the right to:</p>
        <ul style={styles.list}>
          <li>Access your personal data.</li>
          <li>Request correction or deletion of your data.</li>
          <li>Object to or restrict the processing of your data.</li>
          <li>Request data portability.</li>
          <li>
            Withdraw your consent at any time (this will not affect the
            lawfulness of processing before your withdrawal).
          </li>
        </ul>
        <p style={styles.paragraph}>
          If you wish to exercise any of these rights, please contact us at{" "}
          <a href="mailto:support@translayte.it" style={styles.link}>
            support@translayte.it
          </a>
          .
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>8. Security Measures</h2>
        <p style={styles.paragraph}>
          We implement appropriate technical and organizational measures to
          protect your personal data from unauthorized access, disclosure,
          alteration, or destruction.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>9. Changes to the Privacy Policy</h2>
        <p style={styles.paragraph}>
          We may update this Privacy Policy from time to time. The updated
          version will be posted on our website with a new effective date. Your
          continued use of our Service constitutes your acceptance of the
          updated policy.
        </p>
      </section>

      <p style={styles.paragraph}>
        For any questions regarding this Privacy Policy, please contact us at{" "}
        <a href="mailto:support@translayte.it" style={styles.link}>
          support@translayte.it
        </a>
        .
      </p>

      <div style={styles.navigation}>
        <Link href="/" style={styles.navLink}>
          Return to Homepage
        </Link>
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
  list: {
    paddingLeft: "20px",
    marginBottom: "15px",
  },
  navigation: {
    marginTop: "40px",
    textAlign: "center",
  },
  navLink: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
    fontSize: "1rem",
    transition: "background-color 0.3s ease",
  },
};

export default PrivacyPolicyPage;
