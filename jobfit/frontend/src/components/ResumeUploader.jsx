import { useState } from "react";
import { enhanceResume, getResume } from "../services/api";

function ResumeUploader() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleDownload = (resumeId) => {
    console.log("🔵 handleDownload CALLED with ID:", resumeId);
    
    const userInfo = localStorage.getItem("userInfo");
    console.log("🔵 userInfo from localStorage:", userInfo ? "Found" : "NOT FOUND");
    
    if (!userInfo) {
      alert("Please login again");
      return;
    }

    try {
      const parsed = JSON.parse(userInfo);
      console.log("🔵 Parsed user:", { name: parsed.name, hasToken: !!parsed.token });
      
      const { token } = parsed;
      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      const downloadUrl = `http://localhost:5001/api/resume/${resumeId}/download?token=${token}`;
      console.log("📥 DOWNLOAD URL:", downloadUrl);
      
      // Try both methods
      window.open(downloadUrl, "_blank");
      
      // Also try direct location as fallback
      // window.location.href = downloadUrl;
      
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

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("companyUrl", url);

      const response = await enhanceResume(formData);
      console.log("📤 Upload response:", response.data);
      
      const resumeId = response.data?.data?.resumeId || response.data?.resumeId;
      
      if (!resumeId) {
        setError("Failed to start enhancement");
        setLoading(false);
        return;
      }

      console.log("✅ Resume ID:", resumeId);
      setStatus("Processing...");

      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          attempts++;
          const response = await getResume(resumeId);
          const resume = response.data?.data || response.data;
          
          console.log(`🔄 Poll #${attempts}: ${resume.status}`);

          if (resume.status === "completed") {
            clearInterval(interval);
            setResult(resume);
            setStatus("");
            setLoading(false);
            console.log("🎉 Enhancement complete!");
          } else if (resume.status === "failed") {
            clearInterval(interval);
            setError(resume.error || "Enhancement failed");
            setStatus("");
            setLoading(false);
          } else if (resume.status === "scraping") {
            setStatus("🔍 Researching company...");
          } else if (resume.status === "enhancing") {
            setStatus("🤖 Enhancing resume...");
          }

          if (attempts >= 30) {
            clearInterval(interval);
            setError("Processing took too long");
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
      console.error("❌ Upload error:", err);
      setError(err.response?.data?.message || "Error uploading resume");
      setLoading(false);
    }
  };

  // 🔴 TEST FUNCTION - Run this in console to verify
  const testDownload = () => {
    console.log("=== TESTING DOWNLOAD ===");
    const userInfo = localStorage.getItem("userInfo");
    console.log("userInfo exists:", !!userInfo);
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      console.log("Token exists:", !!parsed.token);
      console.log("Token preview:", parsed.token?.substring(0, 20) + "...");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚀 Enhance Your Resume with AI</h1>
      <p style={styles.subtitle}>Upload your resume and target company URL to get an ATS-optimized version</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.group}>
          <label style={styles.label}>📄 Upload Resume (PDF, DOCX, TXT)</label>
          <input 
            type="file" 
            accept=".pdf,.docx,.txt" 
            onChange={(e) => setFile(e.target.files[0])} 
            style={styles.input} 
          />
          {file && <span style={styles.fileName}>✅ {file.name}</span>}
        </div>
        <div style={styles.group}>
          <label style={styles.label}>🏢 Company Website URL</label>
          <input 
            type="url" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="https://company.com" 
            style={styles.input} 
          />
        </div>
        {error && <p style={styles.error}>⚠️ {error}</p>}
        {status && <p style={styles.statusText}>{status}</p>}
        <button type="submit" disabled={loading} style={{
          ...styles.button,
          ...(loading ? styles.buttonDisabled : {})
        }}>
          {loading ? "⏳ Processing..." : "✨ Enhance My Resume"}
        </button>
      </form>

      {result && (
        <div style={styles.resultCard}>
          <h2>✅ Enhancement Complete!</h2>
          
          <div style={styles.scoreBox}>
            <span>ATS Score: {result.atsScore?.before || 0}% → </span>
            <span style={{ color: "#4caf50", fontWeight: "bold" }}>
              {result.atsScore?.after || 0}%
            </span>
          </div>

          {result.companyAnalysis && (
            <div style={styles.companyBox}>
              <h3>🏢 Company Analysis:</h3>
              <p><strong>Company:</strong> {result.companyName}</p>
              <p><strong>Industry:</strong> {result.companyAnalysis?.industry}</p>
              <p><strong>Tech Stack:</strong> {result.companyAnalysis?.techStack?.join(", ")}</p>
              <p><strong>Values:</strong> {result.companyAnalysis?.values?.join(", ")}</p>
            </div>
          )}

          {result.keywords?.length > 0 && (
            <div style={styles.keywords}>
              <h3>🔑 Keywords Added:</h3>
              {result.keywords.map((k, i) => (
                <span key={i} style={styles.tag}>{k}</span>
              ))}
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div style={styles.suggestions}>
              <h3>💡 Suggestions:</h3>
              <ul>
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 🔴 DOWNLOAD BUTTON */}
          <button 
            onClick={() => {
              console.log("🟢 DOWNLOAD BUTTON CLICKED!");
              console.log("Result ID:", result._id);
              handleDownload(result._id);
            }} 
            style={styles.downloadBtn}
            type="button"
          >
            📥 Download Enhanced Resume
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "40px auto", padding: "20px" },
  title: { fontSize: "32px", color: "#1a1a2e", textAlign: "center" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: "30px" },
  form: { background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
  group: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" },
  input: { width: "100%", padding: "10px", borderRadius: "5px", border: "2px solid #ddd", marginTop: "5px", boxSizing: "border-box" },
  fileName: { display: "block", marginTop: "5px", color: "#4caf50", fontSize: "14px" },
  button: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #e94560, #1a1a2e)", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", cursor: "pointer" },
  buttonDisabled: { opacity: 0.7, cursor: "not-allowed" },
  error: { color: "#e53e3e", textAlign: "center", padding: "10px", background: "#fff5f5", borderRadius: "5px" },
  statusText: { textAlign: "center", color: "#667eea", fontWeight: "600" },
  resultCard: { background: "white", padding: "30px", borderRadius: "10px", marginTop: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
  scoreBox: { fontSize: "20px", textAlign: "center", margin: "20px 0", padding: "15px", background: "#f5f5f5", borderRadius: "5px" },
  companyBox: { margin: "20px 0", padding: "15px", background: "#f0f4ff", borderRadius: "5px" },
  keywords: { margin: "20px 0" },
  tag: { display: "inline-block", background: "#e94560", color: "white", padding: "5px 12px", borderRadius: "15px", margin: "3px", fontSize: "13px" },
  suggestions: { margin: "20px 0", padding: "15px", background: "#fff8e1", borderRadius: "5px" },
  downloadBtn: { 
    display: "block", 
    width: "100%", 
    textAlign: "center", 
    padding: "15px", 
    background: "#4caf50", 
    color: "white", 
    border: "none", 
    borderRadius: "5px", 
    fontWeight: "bold", 
    fontSize: "16px", 
    cursor: "pointer", 
    marginTop: "20px" 
  },
};

export default ResumeUploader;