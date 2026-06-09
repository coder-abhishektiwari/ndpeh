"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDB } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { QuizResult, MockResult, UserProfile, ExamCalendarItem } from "@/types";
import { examApi } from "@/lib/api";

type Section = "overview" | "profile" | "quiz" | "mock" | "saved" | "settings";

export default function DashboardPage() {
  const { user, loading, openModal } = useAuth();
  const { showToast } = useToast();
  const [section, setSection] = useState<Section>("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [mockResults, setMockResults] = useState<MockResult[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [settings, setSettings] = useState({ dailyEmailReminder: true, emailNotifications: true });
  const [savedExams, setSavedExams] = useState<ExamCalendarItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash && ["overview", "profile", "quiz", "mock", "saved", "settings"].includes(hash)) setSection(hash as Section);
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDB(); if (!db) return;
    (async () => {
      try {
        const usnap = await getDoc(doc(db, "users", user.uid));
        if (usnap.exists()) {
          const data = usnap.data() as unknown as UserProfile;
          setProfile(data);
          if (data.settings) setSettings({ dailyEmailReminder: data.settings.dailyEmailReminder, emailNotifications: data.settings.emailNotifications });
        }
        const qSnap = await getDocs(query(collection(db, "quizResults"), where("uid", "==", user.uid), orderBy("createdAt", "desc")));
        setQuizResults(qSnap.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as QuizResult) })));
        const mSnap = await getDocs(query(collection(db, "mockResults"), where("uid", "==", user.uid), orderBy("createdAt", "desc")));
        setMockResults(mSnap.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as MockResult) })));
        const saved = await getDoc(doc(db, "savedExams", user.uid));
        if (saved.exists()) setSavedIds((saved.data().examIds as string[]) || []);
      } catch (e) { console.error(e); }
    })();
  }, [user]);

  useEffect(() => {
    if (!savedIds.length) { setSavedExams([]); return; }
    (async () => {
      const exams = await examApi.getExams();
      setSavedExams(exams.filter(e => savedIds.includes(e.id)));
    })();
  }, [savedIds]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSavingProfile(true);
    const db = getFirebaseDB(); if (!db) { setSavingProfile(false); return; }
    try {
      await updateDoc(doc(db, "users", user.uid), { displayName: profile.displayName, examPreparingFor: profile.examPreparingFor });
      showToast("Profile updated", "success");
    } catch { showToast("Failed to update profile", "error"); }
    setSavingProfile(false);
  };

  const toggleSetting = async (key: "dailyEmailReminder" | "emailNotifications") => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    if (!user) return;
    const db = getFirebaseDB(); if (!db) return;
    try { await updateDoc(doc(db, "users", user.uid), { [`settings.${key}`]: next[key] }); showToast("Setting updated", "success"); }
    catch { showToast("Failed to update", "error"); }
  };

  if (loading) return <div className="home-container"><div className="loading-overlay"><div className="loading-spinner" /></div></div>;
  if (!user) {
    return (
      <div className="home-container">
        <div className="dashboard-login-prompt">
          <h2>🔒 Please Login</h2>
          <p>You need to be logged in to access your dashboard.</p>
          <button className="btn btn-primary" onClick={openModal}>Login / Register</button>
        </div>
      </div>
    );
  }

  const totalQuizzes = quizResults.length;
  const totalMocks = mockResults.length;
  const avgQuizScore = quizResults.length ? Math.round(quizResults.reduce((a, r) => a + r.score, 0) / quizResults.length) : 0;
  const mocksPassed = mockResults.filter(r => r.passed).length;
  const initial = (user.displayName || user.email || "A").charAt(0).toUpperCase();

  return (
    <div className="home-container">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-user-info">
            <div className="dashboard-avatar">{initial}</div>
            <div className="dashboard-user-name">{user.displayName || user.email?.split("@")[0]}</div>
            <div className="dashboard-user-email">{user.email}</div>
          </div>
          {(["overview", "profile", "quiz", "mock", "saved", "settings"] as Section[]).map(s => (
            <div key={s} className={`dashboard-nav-item ${section === s ? "active" : ""}`} onClick={() => { setSection(s); window.history.replaceState(null, "", "#" + s); }}>
              {s === "overview" && "📊 Overview"}
              {s === "profile" && "👤 Profile"}
              {s === "quiz" && "📝 My Quizzes"}
              {s === "mock" && "📋 Mock Results"}
              {s === "saved" && "🔖 Saved Exams"}
              {s === "settings" && "⚙️ Settings"}
            </div>
          ))}
        </aside>
        <div className="dashboard-content">
          {section === "overview" && (
            <>
              <h2 className="dashboard-section-title">📊 Overview</h2>
              <div className="dashboard-stats-row">
                <div className="dashboard-stat-card"><div className="dashboard-stat-value">{totalQuizzes}</div><div className="dashboard-stat-label">Quizzes Taken</div></div>
                <div className="dashboard-stat-card"><div className="dashboard-stat-value">{totalMocks}</div><div className="dashboard-stat-label">Mock Tests</div></div>
                <div className="dashboard-stat-card"><div className="dashboard-stat-value">{avgQuizScore}</div><div className="dashboard-stat-label">Avg Quiz Score</div></div>
                <div className="dashboard-stat-card"><div className="dashboard-stat-value">{mocksPassed}/{totalMocks}</div><div className="dashboard-stat-label">Mocks Passed</div></div>
                <div className="dashboard-stat-card"><div className="dashboard-stat-value">{savedIds.length}</div><div className="dashboard-stat-label">Saved Exams</div></div>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "24px", marginBottom: "12px", color: "var(--text-main)" }}>
                Quick Actions
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 12 }}>
                <Link href="/quiz" className="btn btn-primary">Take Quiz</Link>
                <Link href="/mock-test" className="btn btn-primary">Start Mock Test</Link>
                <Link href="/exam-calendar" className="btn btn-secondary">View Calendar</Link>
                <Link href="/all-exams" className="btn btn-secondary">Browse Exams</Link>
              </div>
            </>
          )}
          {section === "profile" && (
            <>
              <h2 className="dashboard-section-title">👤 My Profile</h2>
              <form onSubmit={saveProfile} style={{ maxWidth: 500 }}>
                <div className="dashboard-form-group"><label>Full Name</label><input value={profile?.displayName || ""} onChange={(e) => setProfile(p => p ? { ...p, displayName: e.target.value } : p)} required /></div>
                <div className="dashboard-form-group"><label>Email</label><input value={user.email || ""} disabled /></div>
                <div className="dashboard-form-group"><label>Primary Exam Focus</label>
                  <select value={profile?.examPreparingFor || "Other"} onChange={(e) => setProfile(p => p ? { ...p, examPreparingFor: e.target.value } : p)}>
                    <option>SSC CGL</option><option>SSC GD</option><option>RRB NTPC</option><option>RRB Group D</option><option>UP Police</option><option>Bihar Police</option><option>UPSSSC PET</option><option>Other</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Changes"}</button>
              </form>
            </>
          )}
          {section === "quiz" && (
            <>
              <h2 className="dashboard-section-title">📝 My Quiz Results</h2>
              {quizResults.length === 0 ? <p style={{ color: "var(--text-muted)" }}>You haven't taken any quizzes yet. <Link href="/quiz">Start one now</Link>.</p> : quizResults.map(r => (
                <div className="dashboard-result-card" key={r.id}>
                  <div className="dashboard-result-info"><div className="dashboard-result-title">{r.topic}</div><div className="dashboard-result-meta">{r.correct}/{r.total_questions} correct • {r.accuracy}% accuracy</div></div>
                  <div className="dashboard-result-score">{r.score}</div>
                </div>
              ))}
            </>
          )}
          {section === "mock" && (
            <>
              <h2 className="dashboard-section-title">📋 Mock Test Results</h2>
              {mockResults.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No mock tests attempted yet. <Link href="/mock-test">Start one now</Link>.</p> : mockResults.map(r => (
                <div className="dashboard-result-card" key={r.id}>
                  <div className="dashboard-result-info"><div className="dashboard-result-title">{r.testTitle}</div><div className="dashboard-result-meta">{r.attempted}/{r.total_questions} attempted • {r.accuracy}% accuracy</div></div>
                  <div className="dashboard-result-score" style={{ color: r.passed ? "var(--success)" : "var(--danger)" }}>{r.passed ? "✓" : "✗"} {r.score}/{r.total_marks}</div>
                </div>
              ))}
            </>
          )}
          {section === "saved" && (
            <>
              <h2 className="dashboard-section-title">🔖 Saved Exams</h2>
              {savedExams.length === 0 ? <p style={{ color: "var(--text-muted)" }}>You haven't saved any exams. <Link href="/exam-calendar">Browse the calendar</Link> and save exams.</p> : savedExams.map(e => (
                <div className="dashboard-result-card" key={e.id}>
                  <div className="dashboard-result-info"><div className="dashboard-result-title">{e.examName}</div><div className="dashboard-result-meta">{e.exam_board} • Exam: {e.exam_date}</div></div>
                  <span className={`exam-card-tag ${e.status}`}>{e.status}</span>
                </div>
              ))}
            </>
          )}
          {section === "settings" && (
            <>
              <h2 className="dashboard-section-title">⚙️ Settings</h2>
              <div className="dashboard-toggle-row"><div className="dashboard-toggle-label">📧 Daily Email Reminder</div><div className={`toggle-switch ${settings.dailyEmailReminder ? "on" : ""}`} onClick={() => toggleSetting("dailyEmailReminder")} /></div>
              <div className="dashboard-toggle-row"><div className="dashboard-toggle-label">🔔 Email Notifications</div><div className={`toggle-switch ${settings.emailNotifications ? "on" : ""}`} onClick={() => toggleSetting("emailNotifications")} /></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
