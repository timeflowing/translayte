"use client";

import React, { useState } from "react";

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

const SupportPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: "How do I create a new project?",
      answer:
        "You can create a new project by clicking the '+ Create New Project' button on the Projects page.",
      isOpen: false,
    },
    {
      question: "How do I update my payment method?",
      answer:
        "Navigate to the Billing page and click the 'Update Payment Method' button.",
      isOpen: false,
    },
    {
      question: "Where can I view my API usage?",
      answer: "Your API usage details are available on the API Access page.",
      isOpen: false,
    },
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(
      faqs.map((faq, i) =>
        i === index ? { ...faq, isOpen: !faq.isOpen } : faq
      )
    );
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you can call your API to submit the support message
    console.log("Support message submitted", { name, email, message });
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Support</h1>

      <section style={styles.faqSection}>
        <h2 style={styles.subHeading}>Frequently Asked Questions</h2>
        <div style={styles.faqList}>
          {faqs.map((faq, index) => (
            <div key={index} style={styles.faqItem}>
              <button
                style={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
              >
                {faq.question}
              </button>
              {faq.isOpen && <p style={styles.faqAnswer}>{faq.answer}</p>}
            </div>
          ))}
        </div>
      </section>

      <section style={styles.contactSection}>
        <h2 style={styles.subHeading}>Contact Us</h2>
        {submitted && (
          <p style={styles.successMessage}>
            Thank you for your message! We will get back to you soon.
          </p>
        )}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="name" style={styles.label}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="message" style={styles.label}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={styles.textarea}
            />
          </div>
          <button type="submit" style={styles.submitBtn}>
            Submit
          </button>
        </form>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "20px",
    textAlign: "center",
    color: "#333",
  },
  subHeading: {
    fontSize: "1.5rem",
    marginBottom: "10px",
    color: "#333",
  },
  faqSection: {
    marginBottom: "40px",
  },
  faqList: {
    marginTop: "20px",
  },
  faqItem: {
    marginBottom: "10px",
    borderBottom: "1px solid #eaeaea",
    paddingBottom: "10px",
  },
  faqQuestion: {
    background: "none",
    border: "none",
    textAlign: "left",
    width: "100%",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "10px 0",
    color: "#007BFF",
  },
  faqAnswer: {
    fontSize: "1rem",
    color: "#555",
    paddingLeft: "10px",
  },
  contactSection: {
    marginBottom: "40px",
  },
  form: {
    marginTop: "20px",
    textAlign: "left",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "100px",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  successMessage: {
    color: "green",
    marginBottom: "20px",
  },
};

export default SupportPage;
