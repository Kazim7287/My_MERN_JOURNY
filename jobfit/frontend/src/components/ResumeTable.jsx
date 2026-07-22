import { useState, useEffect } from "react";
import ResumeActions from "./ResumeActions";

function ResumeTable({ resumes: initialResumes }) {
  const [resumes, setResumes] = useState(initialResumes);

  // Sync with parent data when it changes
  useEffect(() => {
    setResumes(initialResumes);
  }, [initialResumes]);

  // 🔴 Handle status update for a single row (called from ResumeActions polling)
  const handleStatusUpdate = (resumeId, updatedData) => {
    setResumes(prev => prev.map(r => 
      r._id === resumeId ? { ...r, ...updatedData } : r
    ));
  };

  // 🔴 Handle delete - remove row immediately without page refresh
  const handleDeleteComplete = (resumeId) => {
    setResumes(prev => prev.filter(r => r._id !== resumeId));
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { icon: "✅", text: "Completed", className: "badge-success" },
      failed: { icon: "❌", text: "Failed", className: "badge-danger" },
      scraping: { icon: "🔍", text: "Researching", className: "badge-info" },
      enhancing: { icon: "🤖", text: "Enhancing", className: "badge-info" },
      pending: { icon: "⏳", text: "Pending", className: "badge-warning" },
    };
    const badge = badges[status] || { icon: "⏳", text: status, className: "badge-default" };
    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { 
      month: "short", day: "numeric", year: "numeric" 
    });
  };

  const truncateName = (name, maxLength = 20) => {
    if (!name) return "Untitled";
    return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
  };

  const truncateFileName = (name, maxLength = 25) => {
    if (!name) return "Unknown file";
    const ext = name.split(".").pop();
    const baseName = name.replace(/\.[^/.]+$/, "");
    if (name.length > maxLength) {
      return baseName.substring(0, maxLength - ext.length - 4) + "..." + ext;
    }
    return name;
  };

  if (!resumes || resumes.length === 0) {
    return null;
  }

  return (
    <div className="history-section">
      <h2>📋 Enhancement History</h2>
      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Resume</th>
              <th>Target Company</th>
              <th>ATS Score</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resumes.map((resume) => (
              <tr key={resume._id} className="table-row">
                <td>
                  <div className="resume-info">
                    <span className="resume-name" title={resume.fullName || "Untitled"}>
                      👤 {truncateName(resume.fullName, 18)}
                    </span>
                    <span className="resume-file" title={resume.originalFileName || ""}>
                      📎 {truncateFileName(resume.originalFileName, 22)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="company-info">
                    <span className="company-name" title={resume.companyName || ""}>
                      🏢 {truncateName(resume.companyName, 18)}
                    </span>
                    {resume.companyAnalysis?.industry && (
                      <span className="company-industry">
                        {resume.companyAnalysis.industry}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {resume.atsScore?.after ? (
                    <div className="score-display">
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{ 
                            width: `${resume.atsScore.after}%`,
                            background: resume.atsScore.after >= 80 ? "#4caf50" : 
                                       resume.atsScore.after >= 60 ? "#ff9800" : "#f44336"
                          }}
                        ></div>
                      </div>
                      <span className="score-text">{resume.atsScore.after}%</span>
                    </div>
                  ) : (
                    <span className="no-score">—</span>
                  )}
                </td>
                <td>{getStatusBadge(resume.status)}</td>
                <td>
                  <span className="date-text">{formatDate(resume.createdAt)}</span>
                </td>
                <td>
                  <ResumeActions 
                    resume={resume} 
                    onStatusUpdate={handleStatusUpdate}
                    onDeleteComplete={handleDeleteComplete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResumeTable;