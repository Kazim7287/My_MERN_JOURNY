import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../services/api";
import StatsCards from "./StatsCards";
import ResumeTable from "./ResumeTable";
import CompaniesList from "./CompaniesList";
import "./Dashboard.css";

function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    averageScore: 0,
    companies: [],
  });

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getHistory();
      const data = response.data?.data || response.data || [];
      setResumes(data);

      const completed = data.filter((r) => r.status === "completed");
      const scores = completed.map((r) => r.atsScore?.after || r.atsScore || 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const companies = [...new Set(data.map((r) => r.companyName).filter(Boolean))];

      setStats({
        total: data.length,
        completed: completed.length,
        averageScore: avgScore,
        companies,
      });
    } catch (err) {
      setError("Failed to load history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📊 My Dashboard</h1>
        <Link to="/" className="btn-new-enhance">
          ✨ New Enhancement
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="error-alert">
          <span>⚠️</span> {error}
          <button onClick={loadHistory} className="btn-retry">Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Empty State */}
      {!loading && resumes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No Resumes Yet</h2>
          <p>Start by enhancing your first resume!</p>
          <Link to="/" className="btn-primary">
            🚀 Enhance Your Resume
          </Link>
        </div>
      )}

      {/* Resume Table */}
      <ResumeTable resumes={resumes} onActionComplete={loadHistory} />

      {/* Companies List */}
      <CompaniesList companies={stats.companies} />
    </div>
  );
}

export default Dashboard;