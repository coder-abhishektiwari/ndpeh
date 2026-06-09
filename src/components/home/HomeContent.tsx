"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { examApi } from "@/lib/api";
import { leaderboardData, testimonialsData } from "@/data/sampleData";
import { LoadingOverlay, SkeletonList } from "@/components/ui/Skeletons";
import { ExamCard } from "@/components/ui/ExamCard";
import type { Paper, Announcement, Bulletin, Analytics } from "@/types";

export function HomeContent() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [liveAnnouncements, setLiveAnnouncements] = useState<Announcement[]>([]);
  const [liveBulletins, setLiveBulletins] = useState<Bulletin[]>([]);
  const [analyticsData, setAnalyticsData] = useState<Analytics>({});

  useEffect(() => {
    (async () => {
      try {
        const [p, a, b, analytics] = await Promise.all([
          examApi.listPapers().catch(() => []),
          examApi.getAnnouncements().catch(() => null),
          examApi.getBulletins().catch(() => null),
          examApi.getAnalytics().catch(() => null),
        ]);
        if (p && p.length) setPapers(p);
        if (a && Array.isArray(a)) setLiveAnnouncements(a);
        if (b && Array.isArray(b)) setLiveBulletins(b);
        if (analytics && typeof analytics === "object") setAnalyticsData(analytics);
      } finally { setLoading(false); }
    })();
  }, []);

  const visiblePapers = showAll ? papers : papers.slice(0, 6);
  const sectors = Array.from(new Set(papers.map(p => p.sector).filter(Boolean) as string[]));

  return (
    <>
      <br />
      <section className="home-hero">
        <div className="home-container">
          <div className="hero-eyebrow">Prepare your govt exam with us</div>
          <h2> Free Mock Tests & Practices for <br /> SSC · RRB · UP Police · State PSC</h2>
          <p>Daily quizzes, mock tests, exam calendar — All are in one place for free</p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Link href="/mock-test" className="home-hero-btn">Satrt Mock Test →</Link>
            <Link href="/exam-calendar" className="home-hero-btn home-hero-btn--ghost">View Exam Calendar</Link>
          </div>
        </div>
      </section>
      <section style={{ padding: "0 0 var(--space-5)" }}>
        <div className="announcement-ticker">
          <div className="ticker-label">LATEST</div>
          <div className="ticker-content">
            {liveAnnouncements.concat(liveAnnouncements).map((a, i) => (
              <span key={a.id + "-" + i}>{a.text} {a.isNew && <span className="new">NEW</span>}</span>
            ))}
          </div>
        </div>
      </section >

      <section className="quick-access-section">
        <div className="home-container">
          <div className="cards-grid">
            <Link href="/exam-calendar" className="qa-card">
              <div className="qa-icon"><svg viewBox="0 0 24 24"><path fill="white" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg></div>
              <h3 className="qa-title">Exam Calendar</h3>
              <p className="qa-desc">Check upcoming exams, application dates and official notifications.</p>
              <span className="qa-link">View Calendar →</span>
            </Link>
            <Link href="/quiz" className="qa-card">
              <div className="qa-icon"><svg viewBox="0 0 24 24"><path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg></div>
              <h3 className="qa-title">Daily Quiz</h3>
              <p className="qa-desc">Practice 10 high-quality questions daily across different subjects.</p>
              <span className="qa-link">Start Practice →</span>
            </Link>
            <Link href="/mock-test" className="qa-card">
              <div className="qa-icon"><svg viewBox="0 0 24 24"><path fill="white" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg></div>
              <h3 className="qa-title">Mock Tests</h3>
              <p className="qa-desc">Attempt full length real exam pattern tests with negative marking.</p>
              <span className="qa-link">Take a Test →</span>
            </Link>
            <a href="#" className="qa-card">
              <div className="qa-icon"><svg viewBox="0 0 24 24"><path fill="white" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" /></svg></div>
              <h3 className="qa-title">Study Material</h3>
              <p className="qa-desc">Download free PDFs, study notes, and previous year question papers.</p>
              <span className="qa-link">Access Materials →</span>
            </a>
            <Link href="/dashboard" className="qa-card">
              <div className="qa-icon"><svg viewBox="0 0 24 24"><path fill="white" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg></div>
              <h3 className="qa-title">My Dashboard</h3>
              <p className="qa-desc">Track your progress, view test analytics, and manage saved exams.</p>
              <span className="qa-link">Go to Dashboard →</span>
            </Link>
            <a href="#homeStatsSection" className="qa-card">
              <div className="qa-icon"><svg viewBox="0 0 24 24"><path fill="white" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h2v5zm4 4h-2v-9h2v9zm-8 0H6v-3h2v3z" /></svg></div>
              <h3 className="qa-title">Leaderboard</h3>
              <p className="qa-desc">Compare your scores with peers and see where you stand.</p>
              <span className="qa-link">View Standings →</span>
            </a>
          </div>
        </div>
      </section>


      <section className="dashboard-grid-section">
        <div className="home-container dashboard-flex-row">

          {/* LEFT COLUMN (70% Area) - Latest Exams */}
          <div className="exams-list-column">
            <div className="featured-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>📚 Latest Exam Papers</h3>
              {!showAll && papers.length > 6 && (
                <Link href="/all-exams" className="btn btn-secondary">
                  Show All ({papers.length})
                </Link>
              )}
            </div>

            <div className="exams-wrapper">
              {loading ? (
                <SkeletonList count={3} />
              ) : visiblePapers.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No exam papers available right now.</p>
              ) : (
                visiblePapers.map(p => <ExamCard key={p.id} paper={p} isCompact={false}/>)
              )}

              {sectors.length > 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>
                  Sectors: {sectors.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (30% Area) - Notifications */}
          <div className="bulletin-list-column" id="notice-bulletin">
            <h3>📋 Latest Notifications & Bulletins</h3>
            <div className="bulletin-wrapper">
              {liveBulletins.slice(0, 5).map((b) => (
                <div className="bulletin-item" key={b.id}>
                  <div className="bulletin-date">{b.date}</div>
                  <div className="bulletin-content">
                    <div className="bulletin-title">{b.title}</div>
                    <div className="bulletin-desc">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="home-stats-section" id="homeStatsSection" aria-label="Portal statistics">
        <div className="home-container">
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>📊 Portal Achievements</h2>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value">{(analyticsData?.totalUsers ?? 0).toLocaleString()}</div><div className="stat-label">Registered Users</div></div>
            <div className="stat-card"><div className="stat-value">{(analyticsData?.totalTests ?? 0).toLocaleString()}</div><div className="stat-label">Tests Taken</div></div>
            <div className="stat-card"><div className="stat-value">{(analyticsData?.totalQuizzes ?? 0).toLocaleString()}</div><div className="stat-label">Quizzes Completed</div></div>
            <div className="stat-card"><div className="stat-value">{(analyticsData?.totalDownloads ?? 0).toLocaleString()}</div><div className="stat-label">PDF Downloads</div></div>
          </div>
          <div className="leaderboard-section">
            <h3>🏆 Top Performers</h3>
            {leaderboardData.map((l, i) => (
              <div className="leaderboard-item" key={i}>
                <div className="leaderboard-badge">{l.badge || `#${i + 1}`}</div>
                <div className="leaderboard-name">{l.name}</div>
                <div className="leaderboard-score">{l.score} pts</div>
              </div>
            ))}
          </div>
          <div className="testimonials-section">
            <h3>💬 What Aspirants Say</h3>
            {testimonialsData.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-stars">{"★".repeat(t.rating)}</div>
                <div className="testimonial-msg">"{t.message}"</div>
                <div className="testimonial-name">— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
