"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Project {
  id: number;
  name: string;
  description: string;
  lastUpdated: string;
}

const dummyProjects: Project[] = [
  {
    id: 1,
    name: "Mobile App",
    description: "Translation keys for mobile app",
    lastUpdated: "2025-02-25",
  },
  {
    id: 2,
    name: "Web App",
    description: "Translation keys for web application",
    lastUpdated: "2025-02-20",
  },
  {
    id: 3,
    name: "Dashboard",
    description: "Dashboard translations",
    lastUpdated: "2025-02-18",
  },
];

const ProjectsPage: React.FC = () => {
  const [projects] = useState<Project[]>(dummyProjects);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Your Projects</h1>
      <Link href="/projects/new">
        <text style={styles.createBtn}>+ Create New Project</text>
      </Link>
      <div style={styles.projectList}>
        {projects.map((project) => (
          <div key={project.id} style={styles.projectCard}>
            <h3 style={styles.projectTitle}>{project.name}</h3>
            <p style={styles.projectDesc}>{project.description}</p>
            <p style={styles.projectDate}>
              Last Updated: {project.lastUpdated}
            </p>
            <div style={styles.cardActions}>
              <Link href={`/projects/${project.id}`}>
                <text style={styles.actionBtn}>View</text>
              </Link>
              <Link href={`/projects/${project.id}/edit`}>
                <text style={styles.actionBtn}>Edit</text>
              </Link>
            </div>
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
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "20px",
    textAlign: "center",
  },
  createBtn: {
    display: "block",
    width: "200px",
    margin: "0 auto 30px",
    padding: "10px",
    backgroundColor: "#007BFF",
    color: "#fff",
    textAlign: "center",
    borderRadius: "5px",
    textDecoration: "none",
  },
  projectList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  projectCard: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    padding: "20px",
    backgroundColor: "#fff",
  },
  projectTitle: {
    margin: "0 0 10px",
  },
  projectDesc: {
    margin: "0 0 10px",
    color: "#555",
  },
  projectDate: {
    margin: "0 0 10px",
    fontSize: "0.9rem",
    color: "#888",
  },
  cardActions: {
    display: "flex",
    gap: "10px",
  },
  actionBtn: {
    padding: "8px 16px",
    backgroundColor: "#007BFF",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
  },
};

export default ProjectsPage;
