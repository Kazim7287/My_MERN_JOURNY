import { useState } from "react";
import { enhanceResume, getResume } from "../services/api";
import ResumeTemplate from "./ResumeTemplate";

import { useAuth } from "../context/AuthContext";
function ResumeUploader() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (resumeId) => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      alert("Please login again");
      return;
    }

    try {
      const { token } = JSON.parse(userInfo);
      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      const downloadUrl = `http://localhost:5001/api/resume/${resumeId}/download?token=${token}`;
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("❌ Download error:", err);
      alert("Failed to download. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !url) return setError("Please provide both resume and company URL");

    setLoading(true);
    setError("");
    setResult(null);
    setShowTemplate(false);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("companyUrl", url);

      const response = await enhanceResume(formData);
      const resumeId = response.data?.data?.resumeId || response.data?.resumeId;
      
      if (!resumeId) {
        setError("Failed to start enhancement");
        setLoading(false);
        return;
      }

      setStatus("Processing...");

      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          attempts++;
          const response = await getResume(resumeId);
          const resume = response.data?.data || response.data;

          if (resume.status === "completed") {
            clearInterval(interval);
            setResult(resume);
            setStatus("");
            setLoading(false);
          } else if (resume.status === "failed") {
            clearInterval(interval);
            setError(resume.error || "Enhancement failed");
            setStatus("");
            setLoading(false);
          } else if (resume.status === "scraping") {
            setStatus("🔍 Researching company website...");
          } else if (resume.status === "enhancing") {
            setStatus("🤖 AI is enhancing your resume...");
          }

          if (attempts >= 60) {
            clearInterval(interval);
            setError("Processing took too long. Please try again.");
            setStatus("");
            setLoading(false);
          }
        } catch (err) {
          clearInterval(interval);
          setError("Error checking status");
          setStatus("");
          setLoading(false);
        }
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Error uploading resume");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {!showTemplate && (
        <>
          <div style={styles.hero}>
            <h1 style={styles.title}>🚀 JobFit AI</h1>
            <p style={styles.subtitle}>
              Upload your resume and a company URL. Our AI will research the company and create an ATS-optimized resume tailored specifically for them.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.group}>
              <label style={styles.label}>📄 Upload Your Resume</label>
              <input 
                type="file" 
                accept=".pdf,.docx,.txt" 
                onChange={(e) => setFile(e.target.files[0])} 
                style={styles.input} 
              />
              {file && <span style={styles.fileName}>✅ {file.name}</span>}
            </div>

            <div style={styles.group}>
              <label style={styles.label}>🏢 Target Company URL</label>
              <input 
                type="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://www.company.com" 
                style={styles.input} 
              />
              <small style={styles.hint}>Enter the company's official website URL</small>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}
            
            {status && (
              <div style={styles.statusBox}>
                <span style={styles.spinner}>⏳</span> {status}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
            >
              {loading ? "⏳ Processing..." : "✨ Enhance My Resume"}
            </button>
          </form>
        </>
      )}

      {/* Results Section */}
      {result && (
        <div style={styles.resultsWrapper}>
          {/* Toggle Buttons */}
          <div style={styles.toggleBar}>
            <button 
              onClick={() => setShowTemplate(false)} 
              style={{
                ...styles.toggleBtn,
                ...(!showTemplate ? styles.toggleActive : {})
              }}
            >
              📊 Analysis
            </button>
            <button 
              onClick={() => setShowTemplate(true)} 
              style={{
                ...styles.toggleBtn,
                ...(showTemplate ? styles.toggleActive : {})
              }}
            >
              📄 View Resume
            </button>
          </div>

          {/* Analysis View */}
          {!showTemplate && (
            <div style={styles.analysisCard}>
              <div style={styles.successHeader}>
                <span style={styles.successIcon}>✅</span>
                <h2 style={styles.successTitle}>Enhancement Complete!</h2>
              </div>
              
              {/* ATS Score */}
              <div style={styles.scoreCard}>
                <h3 style={styles.scoreTitle}>📊 ATS Compatibility Score</h3>
                <div style={styles.scoreDisplay}>
                  <div style={styles.scoreItem}>
                    <span style={styles.scoreLabel}>Before</span>
                    <span style={styles.scoreValue}>{result.atsScore?.before || 0}%</span>
                  </div>
                  <div style={styles.scoreArrow}>→</div>
                  <div style={styles.scoreItem}>
                    <span style={styles.scoreLabel}>After</span>
                    <span style={{...styles.scoreValue, color: "#4caf50"}}>
                      {result.atsScore?.after || 0}%
                    </span>
                  </div>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${result.atsScore?.after || 0}%`,
                    background: result.atsScore?.after >= 80 ? "#4caf50" : 
                               result.atsScore?.after >= 60 ? "#ff9800" : "#f44336"
                  }}></div>
                </div>
              </div>

              {/* Company Analysis */}
              {result.companyAnalysis && (
                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>🏢 Company Research</h3>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <strong>Company:</strong> {result.companyName}
                    </div>
                    <div style={styles.infoItem}>
                      <strong>Industry:</strong> {result.companyAnalysis?.industry}
                    </div>
                    <div style={styles.infoItem}>
                      <strong>Tech Stack:</strong> 
                      <div style={styles.tagContainer}>
                        {result.companyAnalysis?.techStack?.map((tech, i) => (
                          <span key={i} style={styles.tag}>{tech}</span>
                        ))}
                      </div>
                    </div>
                    <div style={styles.infoItem}>
                      <strong>Values:</strong> 
                      <div style={styles.tagContainer}>
                        {result.companyAnalysis?.values?.map((val, i) => (
                          <span key={i} style={styles.tagGreen}>{val}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {result.keywords?.length > 0 && (
                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>🔑 Keywords Optimized</h3>
                  <div style={styles.tagContainer}>
                    {result.keywords.map((k, i) => (
                      <span key={i} style={styles.tagPurple}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>💡 Improvement Suggestions</h3>
                  <ul style={styles.suggestionList}>
                    {result.suggestions.map((s, i) => (
                      <li key={i} style={styles.suggestionItem}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div style={styles.actionBar}>
                <button onClick={() => setShowTemplate(true)} style={styles.viewBtn}>
                  📄 View Enhanced Resume
                </button>
                <button onClick={() => handleDownload(result._id)} style={styles.downloadBtn}>
                  📥 Download PDF
                </button>
                <button onClick={handlePrint} style={styles.printBtn}>
                  🖨️ Print
                </button>
              </div>
            </div>
          )}

          {/* Resume Template View */}
          {showTemplate && (
            <div style={styles.templateWrapper}>
              <div style={styles.templateActions}>
                <button onClick={handlePrint} style={styles.printBtn}>
                  🖨️ Print / Save PDF
                </button>
                <button onClick={() => handleDownload(result._id)} style={styles.downloadBtn}>
                  📥 Download
                </button>
                <button onClick={() => setShowTemplate(false)} style={styles.backBtn}>
                  ← Back to Analysis
                </button>
              </div>
              <ResumeTemplate data={{
                fullName: result.fullName || "Professional",
                title: result.title || `${result.companyAnalysis?.industry || "Technology"} Professional`,
                email: result.email || "",
                phone: result.phone || "",
                location: result.location || "",
                linkedIn: result.linkedIn || "",
                professionalSummary: result.professionalSummary || result.enhancedContent?.split("\n")[0] || "",
                skills: result.skills || result.keywords || result.companyAnalysis?.techStack || [],
                experience: result.experience || [
                  {
                    title: "Professional Experience",
                    company: result.companyName || "",
                    dates: "",
                    achievements: result.enhancedContent?.split("\n").filter(l => l.trim().startsWith("•")) || []
                  }
                ],
                education: result.education || [],
                certifications: result.certifications || [],
                atsScore: result.atsScore?.after || 0,
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "900px", margin: "0 auto", padding: "20px" },
  hero: { textAlign: "center", marginBottom: "30px" },
  title: { fontSize: "42px", fontWeight: "800", color: "#1a1a2e", margin: "0 0 10px 0" },
  subtitle: { fontSize: "16px", color: "#666", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" },
  form: { background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "20px" },
  group: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "600", color: "#333", fontSize: "15px" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "15px", boxSizing: "border-box", transition: "border 0.3s" },
  fileName: { display: "block", marginTop: "8px", color: "#4caf50", fontSize: "14px", fontWeight: "500" },
  hint: { display: "block", marginTop: "5px", color: "#999", fontSize: "12px" },
  button: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #e94560, #1a1a2e)", color: "white", border: "none", borderRadius: "8px", fontSize: "17px", fontWeight: "600", cursor: "pointer", transition: "transform 0.2s" },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  errorBox: { background: "#fff5f5", color: "#e53e3e", padding: "12px", borderRadius: "8px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" },
  statusBox: { background: "#f0f4ff", color: "#667eea", padding: "12px", borderRadius: "8px", marginBottom: "15px", textAlign: "center", fontWeight: "500" },
  spinner: { animation: "spin 1s linear infinite", display: "inline-block" },
  
  // Results
  resultsWrapper: { marginTop: "20px" },
  toggleBar: { display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "center" },
  toggleBtn: { padding: "10px 24px", border: "2px solid #ddd", background: "white", borderRadius: "25px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.3s" },
  toggleActive: { background: "#1a1a2e", color: "white", borderColor: "#1a1a2e" },
  
  // Analysis
  analysisCard: { background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  successHeader: { textAlign: "center", marginBottom: "25px" },
  successIcon: { fontSize: "48px", display: "block", marginBottom: "10px" },
  successTitle: { fontSize: "24px", color: "#1a1a2e", margin: "0" },
  
  // Score
  scoreCard: { background: "#f8f9ff", padding: "20px", borderRadius: "12px", marginBottom: "20px", textAlign: "center" },
  scoreTitle: { fontSize: "16px", color: "#555", marginBottom: "15px" },
  scoreDisplay: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "15px" },
  scoreItem: { textAlign: "center" },
  scoreLabel: { display: "block", fontSize: "12px", color: "#888", marginBottom: "5px" },
  scoreValue: { fontSize: "32px", fontWeight: "800", color: "#1a1a2e" },
  scoreArrow: { fontSize: "24px", color: "#e94560" },
  progressBar: { width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "4px", transition: "width 1s ease" },
  
  // Info Cards
  infoCard: { background: "#f8f9ff", padding: "20px", borderRadius: "12px", marginBottom: "15px" },
  cardTitle: { fontSize: "16px", color: "#1a1a2e", marginBottom: "12px" },
  infoGrid: { display: "grid", gap: "12px" },
  infoItem: { fontSize: "14px", color: "#555", lineHeight: "1.6" },
  tagContainer: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" },
  tag: { background: "#1a1a2e", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" },
  tagGreen: { background: "#4caf50", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" },
  tagPurple: { background: "#7c3aed", color: "white", padding: "5px 12px", borderRadius: "15px", fontSize: "12px", fontWeight: "500" },
  
  // Suggestions
  suggestionList: { margin: "0", paddingLeft: "20px" },
  suggestionItem: { color: "#555", fontSize: "14px", marginBottom: "6px", lineHeight: "1.5" },
  
  // Action Buttons
  actionBar: { display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" },
  viewBtn: { flex: "1", padding: "14px", background: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", minWidth: "150px" },
  downloadBtn: { flex: "1", padding: "14px", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", minWidth: "150px" },
  printBtn: { flex: "1", padding: "14px", background: "#ff9800", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", minWidth: "150px" },
  backBtn: { padding: "10px 20px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
  
  // Template
  templateWrapper: { marginTop: "10px" },
  templateActions: { display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "center", flexWrap: "wrap" },
};

export default ResumeUploader;