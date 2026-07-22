import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { downloadUrl, deleteResume, reEnhanceResume, getResume } from "../services/api";
import "./ResumeActions.css";

function ResumeActions({ resume, onActionComplete, onStatusUpdate }) {
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReEnhanceModal, setShowReEnhanceModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [companyUrl, setCompanyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState(resume.status);

  // Poll for status updates
  useEffect(() => {
    if (currentStatus === "scraping" || currentStatus === "enhancing" || currentStatus === "pending") {
      pollStatus();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentStatus]);

  const pollStatus = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const response = await getResume(resume._id);
        const updated = response.data?.data || response.data;
        
        if (updated.status === "completed") {
          clearInterval(pollingRef.current);
          setCurrentStatus("completed");
          setMessage("✅ Enhancement complete!");
          setTimeout(() => setMessage(""), 3000);
          if (onStatusUpdate) onStatusUpdate(resume._id, updated);
        } else if (updated.status === "failed") {
          clearInterval(pollingRef.current);
          setCurrentStatus("failed");
          setMessage("❌ Enhancement failed");
          setTimeout(() => setMessage(""), 3000);
          if (onStatusUpdate) onStatusUpdate(resume._id, updated);
        } else {
          setCurrentStatus(updated.status);
          if (onStatusUpdate) onStatusUpdate(resume._id, updated);
        }
      } catch (err) {
        clearInterval(pollingRef.current);
      }
    }, 2000);
  };

  // View handler
  const handleView = async () => {
    try {
      setLoading(true);
      const response = await getResume(resume._id);
      const data = response.data?.data || response.data;
      setViewData(data);
      setShowViewModal(true);
    } catch (err) {
      alert("Failed to load resume details");
    } finally {
      setLoading(false);
    }
  };

  // Download handler
  const handleDownload = () => {
    const url = downloadUrl(resume._id);
    if (url) window.open(url, "_blank");
    else alert("Please login again to download");
  };

  // Delete handler
  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteResume(resume._id);
      setShowDeleteModal(false);
      setMessage("🗑️ Deleted successfully!");
      setTimeout(() => {
        setMessage("");
        if (onActionComplete) onActionComplete(resume._id, "deleted");
      }, 500);
    } catch (err) {
      alert("Failed to delete resume");
    } finally {
      setLoading(false);
    }
  };

  // Re-enhance handler
  const confirmReEnhance = async () => {
    if (!companyUrl.trim()) {
      alert("Please enter a company URL");
      return;
    }
    try {
      setLoading(true);
      await reEnhanceResume(resume._id, companyUrl);
      setShowReEnhanceModal(false);
      setCurrentStatus("pending");
      setMessage("🔄 Re-enhancement started...");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      alert("Failed to re-enhance resume");
    } finally {
      setLoading(false);
    }
  };

  const isProcessing = currentStatus === "scraping" || currentStatus === "enhancing" || currentStatus === "pending";

  const quickUrls = [
    { name: "Google", url: "https://www.google.com" },
    { name: "Microsoft", url: "https://www.microsoft.com" },
    { name: "GitHub", url: "https://github.com" },
    { name: "Amazon", url: "https://www.amazon.com" },
    { name: "Stripe", url: "https://stripe.com" },
    { name: "Netflix", url: "https://www.netflix.com" },
  ];

  return (
    <>
      {/* Toast Message */}
      {message && <div className="toast-message"><span>{message}</span></div>}

      {/* Action Buttons */}
      <div className="action-buttons">
        {currentStatus === "completed" && (
          <>
            <button onClick={handleView} className="btn-action btn-view" title="View Resume">
              <span className="action-tooltip">View</span>👁️
            </button>
            <button onClick={handleDownload} className="btn-action btn-download" title="Download PDF">
              <span className="action-tooltip">Download</span>📥
            </button>
            <button onClick={() => { setCompanyUrl(""); setShowReEnhanceModal(true); }} className="btn-action btn-re-enhance" title="Re-enhance">
              <span className="action-tooltip">Re-enhance</span>🔄
            </button>
          </>
        )}
        {currentStatus === "failed" && (
          <button onClick={() => alert(resume.error || "Processing failed")} className="btn-action btn-error" title="View Error">
            <span className="action-tooltip">Error</span>⚠️
          </button>
        )}
        {isProcessing && (
          <div className="processing-indicator">
            <div className="processing-spinner"></div>
            <span className="processing-text">
              {currentStatus === "scraping" ? "Researching..." : currentStatus === "enhancing" ? "Enhancing..." : "Starting..."}
            </span>
          </div>
        )}
        <button onClick={() => setShowDeleteModal(true)} className="btn-action btn-delete" title="Delete Resume">
          <span className="action-tooltip">Delete</span>🗑️
        </button>
      </div>

      {/* ============ VIEW RESUME MODAL ============ */}
      {showViewModal && viewData && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-card modal-view-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>✕</button>
            
            <div className="view-resume-header">
              <h2>{viewData.fullName || "Professional"}</h2>
              <p className="view-resume-title">{viewData.title}</p>
              <div className="view-resume-contact">
                {viewData.email && <span>📧 {viewData.email}</span>}
                {viewData.phone && <span>📱 {viewData.phone}</span>}
                {viewData.location && <span>📍 {viewData.location}</span>}
              </div>
              <div className="view-ats-score">
                🎯 ATS Score: <strong>{viewData.atsScore?.after || viewData.atsScore || 0}%</strong>
              </div>
            </div>

            <div className="view-resume-body">
              {viewData.professionalSummary && (
                <div className="view-section">
                  <h3>Professional Summary</h3>
                  <p>{viewData.professionalSummary}</p>
                </div>
              )}

              {viewData.skills?.length > 0 && (
                <div className="view-section">
                  <h3>Skills</h3>
                  <div className="view-skills">
                    {viewData.skills.map((skill, i) => (
                      <span key={i} className="view-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewData.experience?.length > 0 && (
                <div className="view-section">
                  <h3>Experience</h3>
                  {viewData.experience.map((exp, i) => (
                    <div key={i} className="view-exp-item">
                      <div className="view-exp-header">
                        <strong>{exp.title}</strong>
                        <span className="view-exp-company">{exp.company}</span>
                        <span className="view-exp-dates">{exp.dates}</span>
                      </div>
                      {exp.achievements?.length > 0 && (
                        <ul className="view-achievements">
                          {exp.achievements.map((a, j) => <li key={j}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {viewData.education?.length > 0 && (
                <div className="view-section">
                  <h3>Education</h3>
                  {viewData.education.map((edu, i) => (
                    <p key={i}>{edu.degree} - {edu.school} ({edu.year})</p>
                  ))}
                </div>
              )}

              <div className="view-section">
                <h3>Target Company</h3>
                <p>🏢 <strong>{viewData.companyName || "N/A"}</strong></p>
                {viewData.companyAnalysis?.industry && <p>Industry: {viewData.companyAnalysis.industry}</p>}
              </div>
            </div>

            <div className="view-resume-actions">
              <button onClick={handleDownload} className="btn-modal-primary">📥 Download PDF</button>
              <button onClick={() => setShowViewModal(false)} className="btn-modal-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE MODAL ============ */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            <div className="modal-delete-icon">
              <div className="delete-icon-circle"><span className="delete-icon-inner">🗑️</span></div>
            </div>
            <h2 className="modal-title">Delete Resume?</h2>
            <div className="modal-resume-preview">
              <div className="preview-icon">📄</div>
              <div className="preview-info">
                <span className="preview-name">{resume.fullName || "Untitled"}</span>
                <span className="preview-company">{resume.companyName || "Unknown Company"}</span>
              </div>
            </div>
            <p className="modal-description">This will permanently delete this enhanced resume and all its data.</p>
            <div className="modal-warning-box"><span>⚠️</span><span>This action cannot be undone.</span></div>
            <div className="modal-buttons">
              <button onClick={() => setShowDeleteModal(false)} className="btn-modal-secondary" disabled={loading}>Keep Resume</button>
              <button onClick={confirmDelete} className="btn-modal-danger" disabled={loading}>
                {loading ? <><span className="btn-spinner"></span>Deleting...</> : <><span>🗑️</span>Delete Forever</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ RE-ENHANCE MODAL ============ */}
      {showReEnhanceModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowReEnhanceModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReEnhanceModal(false)}>✕</button>
            <div className="modal-re-enhance-icon">
              <div className="re-enhance-icon-circle"><span className="re-enhance-icon-inner">🔄</span></div>
            </div>
            <h2 className="modal-title">Re-enhance Resume</h2>
            <p className="modal-subtitle">Optimize this resume for a different company</p>
            <div className="modal-resume-preview">
              <div className="preview-icon">📄</div>
              <div className="preview-info">
                <span className="preview-name">{resume.fullName || "Untitled"}</span>
                <span className="preview-company">Currently: {resume.companyName || "N/A"}</span>
              </div>
            </div>
            <div className="modal-input-group">
              <label className="modal-label"><span>🏢</span> New Company URL</label>
              <input type="url" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} placeholder="https://company.com" className="modal-url-input" autoFocus />
              <span className="input-hint">Enter the website URL of the company you're applying to</span>
            </div>
            <div className="quick-suggestions">
              <span className="suggestions-label">Quick pick:</span>
              <div className="suggestions-list">
                {quickUrls.map((item, i) => (
                  <button key={i} onClick={() => setCompanyUrl(item.url)} className={`suggestion-chip ${companyUrl === item.url ? 'active' : ''}`}>{item.name}</button>
                ))}
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowReEnhanceModal(false)} className="btn-modal-secondary" disabled={loading}>Cancel</button>
              <button onClick={confirmReEnhance} className="btn-modal-primary" disabled={loading || !companyUrl.trim()}>
                {loading ? <><span className="btn-spinner"></span>Processing...</> : <><span>🔄</span>Start Enhancement</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ResumeActions;