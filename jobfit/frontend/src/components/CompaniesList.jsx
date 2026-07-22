function CompaniesList({ companies }) {
  if (companies.length === 0) return null;

  return (
    <div className="companies-section">
      <h2>🏢 Companies Applied To</h2>
      <div className="companies-grid">
        {companies.map((company, index) => (
          <div key={index} className="company-card">
            <span className="company-icon">🏢</span>
            <span className="company-name">{company}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompaniesList;