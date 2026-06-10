"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { examApi } from "@/lib/api";
import {SkeletonList } from "@/components/ui/Skeletons";
import { ExamCard } from "@/components/ui/ExamCard";
import type { Paper, Announcement, Bulletin, Analytics, TestimonialData, LeaderboardData } from "@/types";
import { isExamExpired } from "@/lib/examStatus";

export function HomeContent() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [liveAnnouncements, setLiveAnnouncements] = useState<Announcement[]>([]);
  const [liveBulletins, setLiveBulletins] = useState<Bulletin[]>([]);
  const [analyticsData, setAnalyticsData] = useState<Analytics>({ metrics: [] });
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({ leaderboard_data: [] });
  const [testimonialData, setTestimonialData] = useState<TestimonialData>({ testimonial_data: [] });



  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // .catch(() => []) yahan ensure karta hai ki error aane par bhi [] mile
        const [p, a, b, an, lb, ts] = await Promise.all([
          examApi.listPapers().catch(() => []),
          examApi.getAnnouncements().catch(() => []),
          examApi.getBulletins().catch(() => []),
          examApi.getAnalytics().catch(() => ({ metrics: [] })),
          examApi.getLeaderBoard().catch(() => ({ leaderboard_data: [] })),
          examApi.getTestimonial().catch(() => ({ testimonial_data: [] })),
        ]);

        if (isMounted) {
          setPapers(p);
          setLiveAnnouncements(a || []);
          setLiveBulletins(b || []);
          setAnalyticsData(an || { metrics: [] });
          setLeaderboardData(lb || { leaderboard_data: [] });
          setTestimonialData(ts || { testimonial_data: [] });
        }
      } catch (error) {
        console.error("Critical API Failure:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const activePapers = papers.filter(p => !isExamExpired(p));
  const visiblePapers = showAll ? activePapers : activePapers.slice(0, 6);
  const sectors = Array.from(new Set(papers.map(p => p.sector).filter(Boolean) as string[]));

  const filteredPapers = visiblePapers.filter(p => !isExamExpired(p));
  const isRecentlyPosted = (dateString: string) => {
    const bulletinDate = new Date(dateString);
    const today = new Date();
    // Valid date check
    if (isNaN(bulletinDate.getTime())) return false;

    const diffTime = today.getTime() - bulletinDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 10;
  };

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
          <div className="ticker-scroll-area">
            <div className="ticker-content">
              {liveAnnouncements.concat(liveAnnouncements).map((a, i) => (
                <span key={`${a.id}-${i}`}>
                  {a.icon} {a.title}: {a.description}
                  {a.isNew && <span className="new">NEW</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section >

      <section className="quick-access-section">
        <div className="home-container">

          {/* Section Header - Centered */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{ width: "4px", height: "28px", background: "#1a3a6b", borderRadius: "2px", flexShrink: 0 }}></div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 500, color: "var(--color-text-primary)" }}>Quick Access</h2>
              <div style={{ width: "4px", height: "28px", background: "#1a3a6b", borderRadius: "2px", flexShrink: 0 }}></div>
            </div>
            <p style={{ margin: "0 auto", fontSize: "15px", color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: "520px" }}>
              Everything you need for exam prep — calendar, quizzes, mock tests, and your personal dashboard — all in one place.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="cards-grid">
            <Link href="/exam-calendar" className="qa-card">
              <div style={{ width: "40px", height: "40px", background: "#1a3a6b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
              </div>
              <h3 className="qa-title">Exam Calendar</h3>
              <p className="qa-desc">Check upcoming exams, application dates and official notifications.</p>
              <span className="qa-link" style={{ color: "#1a3a6b" }}>View Calendar →</span>
            </Link>

            <Link href="/quiz" className="qa-card">
              <div style={{ width: "40px", height: "40px", background: "#FF9933", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
              </div>
              <h3 className="qa-title">Daily Quiz</h3>
              <p className="qa-desc">Practice 10 high-quality questions daily across different subjects.</p>
              <span className="qa-link" style={{ color: "#d4780c" }}>Start Practice →</span>
            </Link>

            <Link href="/mock-test" className="qa-card">
              <div style={{ width: "40px", height: "40px", background: "#138808", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
              </div>
              <h3 className="qa-title">Mock Tests</h3>
              <p className="qa-desc">Attempt full length real exam pattern tests with negative marking.</p>
              <span className="qa-link" style={{ color: "#138808" }}>Take a Test →</span>
            </Link>

            <a href="#" className="qa-card">
              <div style={{ width: "40px", height: "40px", background: "#1a3a6b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" /></svg>
              </div>
              <h3 className="qa-title">Study Material</h3>
              <p className="qa-desc">Download free PDFs, study notes, and previous year question papers.</p>
              <span className="qa-link" style={{ color: "#1a3a6b" }}>Access Materials →</span>
            </a>

            <Link href="/dashboard" className="qa-card">
              <div style={{ width: "40px", height: "40px", background: "#FF9933", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
              </div>
              <h3 className="qa-title">My Dashboard</h3>
              <p className="qa-desc">Track your progress, view test analytics, and manage saved exams.</p>
              <span className="qa-link" style={{ color: "#d4780c" }}>Go to Dashboard →</span>
            </Link>

            <a href="#homeStatsSection" className="qa-card">
              <div style={{ width: "40px", height: "40px", background: "#138808", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h2v5zm4 4h-2v-9h2v9zm-8 0H6v-3h2v3z" /></svg>
              </div>
              <h3 className="qa-title">Leaderboard</h3>
              <p className="qa-desc">Compare your scores with peers and see where you stand nationally.</p>
              <span className="qa-link" style={{ color: "#138808" }}>View Standings →</span>
            </a>
          </div>

          {/* Onboarding nudge */}
          <div style={{ marginTop: "20px", padding: "14px 18px", background: "var(--color-background-secondary)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", border: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ width: "8px", height: "8px", background: "#138808", borderRadius: "50%", flexShrink: 0 }}></div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>New to NDPEH?</strong> — Start with the Daily Quiz to assess your current level, then move to mock tests for full exam simulation.
            </p>
          </div>

        </div>
      </section>


{/* // ─────────────────────────────────────────────────────────────────
//  SECTION 1 ─ Dashboard Grid (Latest Papers + Notifications)
// ───────────────────────────────────────────────────────────────── */}

<section className="dashboard-grid-section">
  {/* ── Section Intro ── */}
  <div className="home-container section-intro-row">
    <div className="section-eyebrow">📅 Updated Daily</div>
    <h2 className="section-heading">Stay Ahead of Every Exam</h2>
    <p className="section-subtext">
      Browse the latest government exam papers, official notifications, and admit card bulletins —
      all in one place, curated and refreshed every day so you never miss a deadline.
    </p>
  </div>

  {/* ── Exam Categories Quick Filter (static intro chips) ── */}
  <div className="home-container">
    <div className="category-chips-row">
      {[
        { icon: "🏛️", label: "UPSC" },
        { icon: "🚔", label: "SSC" },
        { icon: "🚂", label: "Railways" },
        { icon: "🏦", label: "Banking" },
        { icon: "👮", label: "Police" },
        { icon: "🎓", label: "Teaching" },
        { icon: "🪖", label: "Defence" },
        { icon: "⚕️", label: "Medical" },
      ].map(({ icon, label }) => (
        <span className="category-chip" key={label}>
          {icon} {label}
        </span>
      ))}
    </div>
  </div>

  {/* ── Main Two-Column Grid ── */}
  <div className="home-container dashboard-flex-row">

    {/* LEFT ─ Latest Exam Papers */}
    <div className="exams-list-column">
      <div
        className="featured-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h3>📚 Latest Exam Papers</h3>
        {!showAll && papers.length > 6 && (
          <Link href="/all-exams" className="btn btn-secondary">
            Show All ({papers.length})
          </Link>
        )}
      </div>

      <div className="exams-wrapper">
        {loading ? (
          <>
            <SkeletonList count={6} />
            <div className="skeleton-line w-30" />
          </>
        ) : filteredPapers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🗂️</span>
            <p>No exam papers available right now.<br />Check back soon — we update daily.</p>
          </div>
        ) : (
          filteredPapers.map((p) => <ExamCard key={p.id} paper={p} isCompact={false} />)
        )}

        {sectors.length > 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>
            Sectors: {sectors.join(", ")}
          </p>
        )}
      </div>
    </div>

    {/* RIGHT ─ Notifications & Bulletins */}
    <div className="bulletin-list-column" id="notice-bulletin">
      {/* Pulse live badge */}
      <div className="bulletin-header">
        <h3>📋 Notifications & Bulletins</h3>
        <span className="live-pulse-badge">
          <span className="pulse-dot" /> LIVE
        </span>
      </div>
      <p className="bulletin-intro-text">
        Official alerts for new vacancies, admit cards, results & syllabus updates
        — straight from recruiting bodies.
      </p>

      <div className="bulletin-wrapper">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div className="stat-card skeleton-card" key={`stat-skeleton-${i}`}>
                <center>
                  <div className="skeleton-line h-20" />
                  <div className="skeleton-line h-10" />
                  <div className="skeleton-line h-10" />
                  <div className="skeleton-line h-10" />
                </center>
              </div>
            ))
          : liveBulletins.map((b) => {
              const showNewBadge = isRecentlyPosted(b.date);
              return (
                <a
                  href={b.link}
                  className="bulletin-item"
                  key={b.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <div className="bulletin-date">{b.date}</div>
                    {showNewBadge && <span className="new-badge">NEW</span>}
                  </div>
                  <div className="bulletin-title">{b.title}</div>
                </a>
              );
            })}
      </div>
    </div>
  </div>
</section>


{/* ─────────────────────────────────────────────────────────────────
    STATIC SECTION ─ How It Works  (no dynamic data needed)
───────────────────────────────────────────────────────────────── */}

<section className="how-it-works-section">
  <div className="home-container">
    <div className="section-eyebrow">✨ Simple & Effective</div>
    <h2 className="section-heading">Your Preparation, Simplified</h2>
    <p className="section-subtext">
      From discovering the right exam to cracking it with confidence — here's how the platform
      supports you at every step.
    </p>

    <div className="hiw-grid">
      {[
        {
          step: "01",
          icon: "🔍",
          title: "Discover Your Exam",
          desc: "Browse 100+ upcoming central and state government exams filtered by sector, board, and eligibility — no more hunting across websites.",
        },
        {
          step: "02",
          icon: "📝",
          title: "Practice with Real Papers",
          desc: "Attempt previous year question papers and AI-generated mock tests, designed to match the exact pattern of each exam.",
        },
        {
          step: "03",
          icon: "📊",
          title: "Track & Improve",
          desc: "See your score trends, weak topics, and time-per-question analytics. Know exactly where to focus next.",
        },
      ].map(({ step, icon, title, desc }) => (
        <div className="hiw-card" key={step}>
          <div className="hiw-step-badge">{step}</div>
          <div className="hiw-icon">{icon}</div>
          <h4 className="hiw-title">{title}</h4>
          <p className="hiw-desc">{desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>


{/* ─────────────────────────────────────────────────────────────────
    SECTION 2 ─ Portal Achievements + Leaderboard + Testimonials
───────────────────────────────────────────────────────────────── */}

<section className="home-stats-section" id="homeStatsSection" aria-label="Portal statistics">
  <div className="home-container">

    {/* ── Section Intro ── */}
    <div className="section-intro-row" style={{ marginBottom: 32 }}>
      <div className="section-eyebrow">🏅 Community</div>
      <h2 className="section-heading">Numbers That Speak</h2>
      <p className="section-subtext">
        A growing community of government job aspirants trusts this platform every day.
        Here's a look at what we've built together.
      </p>
    </div>

    {/* ── Stats Grid ── */}
    <div className="stats-grid">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div className="stat-card skeleton-card" key={`stat-skeleton-${i}`}>
              <center>
                <div className="skeleton-line h-30" />
                <div className="skeleton-line h-10" />
              </center>
            </div>
          ))
        : analyticsData?.metrics?.map((m, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-value">{m.label}</div>
              <div className="stat-label">{m.description}</div>
            </div>
          ))}
    </div>

    {/* ── Leaderboard ── */}
    <div className="leaderboard-section">
      <div className="subsection-header">
        <h3>🏆 Top Performers This Week</h3>
        <p className="subsection-subtext">
          These aspirants scored highest across mock tests this week. Could you be next?
        </p>
      </div>

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div className="skeleton-card" key={`skeleton-${i}`} style={{ marginBottom: "10px" }}>
            <div className="skeleton-line w-10" />
          </div>
        ))
      ) : leaderboardData?.leaderboard_data &&
        Array.isArray(leaderboardData.leaderboard_data) &&
        leaderboardData.leaderboard_data.length > 0 ? (
        leaderboardData.leaderboard_data.slice(0, 5).map((l, i) => {
          const getBadge = (index:number) => {
            if (index === 0) return "🥇";
            if (index === 1) return "🥈";
            if (index === 2) return "🥉";
            return `#${index + 1}`;
          };
          return (
            <div className="leaderboard-item" key={i}>
              <div className="leaderboard-badge">{getBadge(i)}</div>
              <div className="leaderboard-name">{l.name}</div>
              <div className="leaderboard-score">{l.score} pts</div>
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <span className="empty-icon">🏅</span>
          <p>No leaderboard data yet. Take a mock test to get on the board!</p>
        </div>
      )}
    </div>

    {/* ── Testimonials ── */}
    <div className="testimonials-section">
      <div className="subsection-header">
        <h3>💬 Aspirants Who Made It</h3>
        <p className="subsection-subtext">
          Real words from real students who prepared here and cleared their exams.
        </p>
      </div>

      {!loading ? (
        testimonialData?.testimonial_data && Array.isArray(testimonialData.testimonial_data) ? (
          testimonialData.testimonial_data.slice(0, 3).map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="testimonial-stars">{"★".repeat(t.rating)}</div>
              <div className="testimonial-msg">"{t.message}"</div>
              <div className="testimonial-name">— {t.name}</div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
            No testimonials yet — be the first to share your experience!
          </p>
        )
      ) : (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton-line w-30" />
              <div className="skeleton-line w-30" />
              <div className="skeleton-line w-30" />
            </div>
          ))}
        </>
      )}
    </div>
  </div>
</section>
    </>
  );
}
