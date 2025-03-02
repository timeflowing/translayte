"use client";

import React from "react";
import Link from "next/link";

const TermsPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Terms of Service</h1>
      <p style={styles.paragraph}>Effective Date: January 1, 2025</p>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>1. Introduction</h2>
        <p style={styles.paragraph}>
          Welcome to Translayte. These Terms of Service (&quot;Terms&quot;)
          govern your use of the website www.translayte.it and any services
          provided by Translayte (&quot;Service&quot;). By accessing or using
          our Service, you agree to be bound by these Terms. If you do not agree
          to these Terms, please do not use our Service.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>2. Description of Services</h2>
        <p style={styles.paragraph}>
          Translayte offers a translation management platform for developers and
          businesses, providing services such as key translation, API
          integration, and project management for localization tasks.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>3. User Registration and Account</h2>
        <p style={styles.paragraph}>
          <ul style={styles.list}>
            <li>Registration may be required to access certain features.</li>
            <li>
              You agree to provide accurate and current information during the
              registration process.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </li>
            <li>
              Translayte reserves the right to suspend or terminate your account
              if you violate these Terms.
            </li>
          </ul>
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>4. Payment Terms</h2>
        <p style={styles.paragraph}>
          <ul style={styles.list}>
            <li>
              Some features of the Service are available on a subscription basis
              or for a one-time fee.
            </li>
            <li>
              All prices, fees, and billing terms are described on our website.
            </li>
            <li>
              Payments are processed through authorized payment gateways (e.g.,
              Stripe).
            </li>
            <li>
              By subscribing to our Service, you agree to the billing terms and
              authorize us to charge your chosen payment method.
            </li>
          </ul>
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>5. Refunds and Cancellations</h2>
        <p style={styles.paragraph}>
          <ul style={styles.list}>
            <li>
              Refunds for paid services are provided in accordance with our
              refund policy, which is available on our website.
            </li>
            <li>
              Cancellation of subscriptions must be made in accordance with the
              instructions provided on your account dashboard.
            </li>
            <li>
              Translayte reserves the right to modify or cancel any service
              without prior notice, subject to applicable laws.
            </li>
          </ul>
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>6. Privacy</h2>
        <p style={styles.paragraph}>
          Your use of our Service is also governed by our Privacy Policy, which
          explains how we collect, use, and protect your personal information.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>7. Intellectual Property</h2>
        <p style={styles.paragraph}>
          <ul style={styles.list}>
            <li>
              All content, software, and technology available on Translayte are
              protected by copyright, trademark, and other intellectual property
              laws.
            </li>
            <li>
              You may not reproduce, modify, distribute, or exploit any part of
              our Service without express written consent from Translayte.
            </li>
          </ul>
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>8. Limitation of Liability</h2>
        <p style={styles.paragraph}>
          <ul style={styles.list}>
            <li>
              The Service is provided &quot;as is&quot; without warranties of
              any kind, either expressed or implied.
            </li>
            <li>
              Translayte shall not be liable for any indirect, incidental, or
              consequential damages arising out of or related to your use of the
              Service, except in cases of gross negligence or willful
              misconduct.
            </li>
            <li>
              Our total liability under these Terms shall not exceed the amount
              you paid to use our Service, if any.
            </li>
          </ul>
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>9. Changes to the Terms</h2>
        <p style={styles.paragraph}>
          Translayte reserves the right to modify these Terms at any time. The
          updated version will be posted on our website, and your continued use
          of the Service constitutes your acceptance of the revised Terms.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.subHeading}>
          10. Governing Law and Dispute Resolution
        </h2>
        <p style={styles.paragraph}>
          These Terms shall be governed by and construed in accordance with the
          laws of the Czech Republic. Any disputes arising from these Terms will
          be resolved in accordance with Czech law, and both parties agree to
          submit to the jurisdiction of the appropriate courts in the Czech
          Republic.
        </p>
      </section>

      <p style={styles.paragraph}>
        If you have any questions regarding these Terms, please contact us at{" "}
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
    marginBottom: "10px",
    marginTop: "20px",
    color: "#007BFF",
  },
  paragraph: {
    fontSize: "1rem",
    marginBottom: "15px",
  },
  section: {
    marginBottom: "30px",
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

export default TermsPage;
