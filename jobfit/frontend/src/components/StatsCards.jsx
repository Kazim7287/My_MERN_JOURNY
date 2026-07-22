function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">📄</div>
        <div className="stat-info">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Resumes</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <span className="stat-number">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🎯</div>
        <div className="stat-info">
          <span className="stat-number">{stats.averageScore}%</span>
          <span className="stat-label">Avg ATS Score</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🏢</div>
        <div className="stat-info">
          <span className="stat-number">{stats.companies.length}</span>
          <span className="stat-label">Companies</span>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;