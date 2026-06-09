"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { examApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { getFirebaseDB } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ConfirmModal } from "@/components/ui/Modals";
import type { MockTest, MockResult } from "@/types";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function MockTestPage() {
  const { user, requireAuth } = useAuth();
  const { showToast } = useToast();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [test, setTest] = useState<MockTest | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const t = await examApi.getMockTests();
      if (t.length) setMockTests(t);
      else {
        const { mockTests: fallback } = await import("@/data/sampleData");
        setMockTests(fallback);
      }
    })();
  }, []);

  const startTest = (t: MockTest) => {
    if (!requireAuth()) return;
    setTest(t); setIdx(0); setAnswers(new Array(t.questions.length).fill(null));
    setMarked(new Set()); setTimeLeft(t.duration * 60); setShowResult(false); savedRef.current = false;
  };

  useEffect(() => {
    if (!test || showResult) return;
    if (timeLeft <= 0) { finishTest(); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [test, timeLeft, showResult]);

  const finishTest = async () => {
    if (!test || savedRef.current) return;
    savedRef.current = true; setShowResult(true);
    let correct = 0, incorrect = 0, attempted = 0;
    answers.forEach((a, i) => { if (a !== null) { attempted++; if (a === test.questions[i].answer) correct++; else incorrect++; } });
    const raw = correct * (test.total_marks / test.total_questions);
    const neg = incorrect * test.negativeMarking;
    const score = Math.max(0, raw - neg);
    const passed = score >= test.passingMarks;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    if (user) {
      const db = getFirebaseDB();
      if (db) {
        try {
          await addDoc(collection(db, "mockResults"), { uid: user.uid, testId: test.id, testTitle: test.title, total_questions: test.total_questions, attempted, correct, incorrect, score, total_marks: test.total_marks, accuracy, timeSpent: (test.duration * 60) - timeLeft, passed, createdAt: serverTimestamp() } as MockResult);
          showToast(`Result saved: ${passed ? "PASSED" : "FAILED"}`, passed ? "success" : "warning");
        } catch { showToast("Score computed (could not save)", "warning"); }
      }
    } else { showToast(`Score: ${score} (${passed ? "PASSED" : "FAILED"})`, "info"); }
  };

  if (!test) {
    return (
      <div className="home-container">
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "20px 0" }}>📋 Mock Tests</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Attempt real exam pattern tests with negative marking and timed sessions.</p>
        <div className="mock-tests-grid">
          {mockTests.map(t => (
            <div className="mock-test-card" key={t.id}>
              <div className="mock-test-title">{t.title}</div>
              <div className="mock-test-desc">{t.description}</div>
              <div className="mock-test-info">
                <div className="mock-test-info-item"><div className="label">Duration</div><div className="value">{t.duration} min</div></div>
                <div className="mock-test-info-item"><div className="label">Questions</div><div className="value">{t.total_questions}</div></div>
                <div className="mock-test-info-item"><div className="label">Total Marks</div><div className="value">{t.total_marks}</div></div>
                <div className="mock-test-info-item"><div className="label">Negative</div><div className="value">−{t.negativeMarking}</div></div>
                <div className="mock-test-info-item"><div className="label">Pass Marks</div><div className="value">{t.passingMarks}</div></div>
                <div className="mock-test-info-item"><div className="label">Category</div><div className="value">{t.category}</div></div>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => startTest(t)}>Start Test</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showResult) {
    let correct = 0, incorrect = 0, attempted = 0;
    answers.forEach((a, i) => { if (a !== null) { attempted++; if (a === test.questions[i].answer) correct++; else incorrect++; } });
    const raw = correct * (test.total_marks / test.total_questions);
    const neg = incorrect * test.negativeMarking;
    const score = Math.max(0, +((raw - neg)).toFixed(2));
    const passed = score >= test.passingMarks;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return (
      <div className="home-container">
        <div className="mock-result-screen">
          <h2>{test.title}</h2>
          <div className={`mock-pass-badge ${passed ? "pass" : "fail"}`}>{passed ? "✓ PASSED" : "✗ FAILED"}</div>
          <svg className="mock-score-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" stroke="var(--surface-2)" strokeWidth="14" fill="none" />
            <circle cx="100" cy="100" r="90" stroke={passed ? "url(#g2)" : "url(#g3)"} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={`${(score / test.total_marks) * 565} 565`} transform="rotate(-90 100 100)" />
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#43e97b" /><stop offset="100%" stopColor="#38f9d7" /></linearGradient>
              <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5576c" /><stop offset="100%" stopColor="#ff6b6b" /></linearGradient>
            </defs>
            <text x="100" y="100" textAnchor="middle" dy=".3em" fontSize="36" fontWeight="800" fill="var(--text-main)">{score}/{test.total_marks}</text>
          </svg>
          <div className="mock-stats">
            <div className="mock-stat"><div className="mock-stat-value">{correct}</div><div className="mock-stat-label">Correct</div></div>
            <div className="mock-stat"><div className="mock-stat-value">{incorrect}</div><div className="mock-stat-label">Incorrect</div></div>
            <div className="mock-stat"><div className="mock-stat-value">{attempted}</div><div className="mock-stat-label">Attempted</div></div>
            <div className="mock-stat"><div className="mock-stat-value">{accuracy}%</div><div className="mock-stat-label">Accuracy</div></div>
            <div className="mock-stat"><div className="mock-stat-value">−{incorrect * test.negativeMarking}</div><div className="mock-stat-label">Negative</div></div>
          </div>
          <h3 style={{ marginTop: 24, marginBottom: 12 }}>Question-wise Analysis</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="mock-analysis-table">
              <thead><tr><th>#</th><th>Status</th><th>Your Answer</th><th>Correct</th></tr></thead>
              <tbody>
                {test.questions.map((q, i) => {
                  const a = answers[i]; const isCorrect = a === q.answer; const skipped = a === null;
                  return <tr key={i}><td>{i + 1}</td><td>{skipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}</td><td>{a !== null ? String.fromCharCode(65 + a) : "—"}</td><td>{String.fromCharCode(65 + q.answer)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => setTest(null)}>Back to Tests</button>
          </div>
        </div>
      </div>
    );
  }

  const q = test.questions[idx];
  const selected = answers[idx];
  return (
    <div className="home-container">
      <div className="mock-container">
        <div className="mock-progress">
          <span>Q{idx + 1} of {test.questions.length}</span>
          <div className={`mock-timer ${timeLeft <= 60 ? "warning" : ""}`}>{fmt(timeLeft)}</div>
        </div>
        <div className="mock-layout">
          <div>
            <div className="mock-question">
              <div className="mock-q-text">{q.q}</div>
              <div className="mock-options">
                {q.options.map((opt, i) => (
                  <div key={i} className={`mock-option ${selected === i ? "selected" : ""}`} onClick={() => setAnswers(p => { const n = [...p]; n[idx] = i; return n; })}>
                    <div className="mock-option-letter">{String.fromCharCode(65 + i)}</div>
                    <div>{opt}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={() => setTest(null)}>Exit</button>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={() => setMarked(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}>{marked.has(idx) ? "Unmark" : "Mark"}</button>
                <button className="btn btn-secondary" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>Previous</button>
                {idx < test.questions.length - 1 ? <button className="btn btn-primary" onClick={() => setIdx(i => i + 1)}>Save & Next</button> : <button className="btn btn-success" onClick={() => setConfirm(true)}>Submit Test</button>}
              </div>
            </div>
          </div>
          <div className="mock-sidebar">
            <div className="mock-palette">
              {test.questions.map((_, i) => (
                <div key={i} className={`palette-item ${answers[i] !== null ? "answered" : ""} ${marked.has(i) ? "marked" : ""} ${i === idx ? "current" : ""}`} onClick={() => setIdx(i)}>{i + 1}</div>
              ))}
            </div>
            <div className="mock-legend">
              <div className="mock-legend-item"><div className="mock-legend-color" style={{ background: "var(--gradient-success)" }} /> Answered</div>
              <div className="mock-legend-item"><div className="mock-legend-color" style={{ background: "var(--gradient-warning)" }} /> Marked</div>
              <div className="mock-legend-item"><div className="mock-legend-color" style={{ background: "var(--gradient-primary)" }} /> Current</div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal open={confirm} title="Submit Test?" message="You will not be able to change your answers after submitting." confirmText="Submit" onConfirm={() => { setConfirm(false); finishTest(); }} onCancel={() => setConfirm(false)} />
    </div>
  );
}
