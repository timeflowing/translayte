"use client";

import React, { useState } from "react";

interface Job {
  id: number;
  title: string;
  location: string;
  description: string;
}

const dummyJobs: Job[] = [
  {
    id: 1,
    title: "Frontend Developer",
    location: "Remote",
    description:
      "We are looking for a skilled frontend developer with expertise in React and Next.js to join our dynamic team.",
  },
  {
    id: 2,
    title: "Backend Developer",
    location: "Remote",
    description:
      "Seeking an experienced backend developer proficient in Node.js and Express, with knowledge of API development.",
  },
  {
    id: 3,
    title: "UX/UI Designer",
    location: "Remote",
    description:
      "We need a creative UX/UI designer to improve our product's interface and user experience.",
  },
];

const CareersPage: React.FC = () => {
  const [jobs] = useState<Job[]>(dummyJobs);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Careers at Translayte</h1>
      <p style={styles.subHeading}>
        Join our team and help us build the future of translation tools.
      </p>
      <div style={styles.jobsList}>
        {jobs.map((job) => (
          <div key={job.id} style={styles.jobCard}>
            <h2 style={styles.jobTitle}>{job.title}</h2>
            <p style={styles.jobLocation}>Location: {job.location}</p>
            <p style={styles.jobDescription}>{job.description}</p>
            <button style={styles.applyButton}>Apply Now</button>
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
  jobsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  jobCard: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
    textAlign: "left",
  },
  jobTitle: {
    fontSize: "1.8rem",
    marginBottom: "5px",
    color: "#007BFF",
  },
  jobLocation: {
    fontSize: "1rem",
    marginBottom: "10px",
    color: "#888",
  },
  jobDescription: {
    fontSize: "1rem",
    marginBottom: "15px",
    color: "#555",
  },
  applyButton: {
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CareersPage;
