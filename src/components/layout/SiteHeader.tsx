export function SiteHeader() {
  return (
    <header className="portal-main-header">
      <div className="emblem-title-block">
        <div className="digital-seal-icon" aria-hidden="true">DEH</div>
        <div className="portal-meta-titles">
          <h1>National Digital Exam Preparation Hub</h1>
          <p>Department of Information Infrastructure & Accelerated Education Resources</p>
        </div>
      </div>
      <div className="support-badges" aria-label="System verification timestamps">
        <div className="badge-item">
          <span>Portal Deployment Status</span>
          <strong>Verified Live</strong>
        </div>
        <div className="badge-item">
          <span>Academic Cycle Reference</span>
          <strong>2025 - 2026</strong>
        </div>
      </div>
    </header>
  );
}
