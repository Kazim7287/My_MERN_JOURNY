import React from "react";
import "./ResumeTemplate.css";
import { useAuth } from "../context/AuthContext";

function ResumeTemplate({ data }) {
  if (!data) return null;

  const {
    fullName,
    title,
    email,
    phone,
    location,
    linkedIn,
    professionalSummary,
    skills,
    experience,
    education,
    certifications,
    atsScore,
  } = data;

  return (
    <div className="resume-template" id="resume-print">
      {/* ATS Score Badge */}
      <div className="ats-badge">
        🎯 ATS Score: <strong>{atsScore}%</strong>
      </div>

      {/* Header */}
      <div className="resume-header">
        <h1 className="resume-name">{fullName}</h1>
        <h2 className="resume-title">{title}</h2>
        <div className="resume-contact">
          {email && <span>📧 {email}</span>}
          {phone && <span>📱 {phone}</span>}
          {location && <span>📍 {location}</span>}
          {linkedIn && <span>🔗 {linkedIn}</span>}
        </div>
      </div>

      {/* Professional Summary */}
      <div className="resume-section">
        <h3 className="section-title">Professional Summary</h3>
        <p className="summary-text">{professionalSummary}</p>
      </div>

      {/* Skills */}
      <div className="resume-section">
        <h3 className="section-title">Technical Skills</h3>
        <div className="skills-grid">
          {skills?.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="resume-section">
        <h3 className="section-title">Professional Experience</h3>
        {experience?.map((exp, index) => (
          <div key={index} className="experience-item">
            <div className="experience-header">
              <h4 className="job-title">{exp.title}</h4>
              <span className="job-company">{exp.company}</span>
              <span className="job-dates">{exp.dates}</span>
            </div>
            <ul className="achievements-list">
              {exp.achievements?.map((achievement, i) => (
                <li key={i} className="achievement-item">
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="resume-section">
        <h3 className="section-title">Education</h3>
        {education?.map((edu, index) => (
          <div key={index} className="education-item">
            <h4 className="edu-degree">{edu.degree}</h4>
            <span className="edu-school">{edu.school}</span>
            <span className="edu-year">{edu.year}</span>
          </div>
        ))}
      </div>

      {/* Certifications */}
      {certifications?.length > 0 && (
        <div className="resume-section">
          <h3 className="section-title">Certifications</h3>
          {certifications.map((cert, index) => (
            <div key={index} className="cert-item">
              <span className="cert-name">📜 {cert.name}</span>
              <span className="cert-issuer">{cert.issuer}</span>
              <span className="cert-year">{cert.year}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumeTemplate;