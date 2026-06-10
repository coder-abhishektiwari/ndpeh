"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { examApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { getFirebaseDB } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ConfirmModal } from "@/components/ui/Modals";
import type { MockTest, MockResult, LayoutType, SectionConfig, Session, Question } from "@/types";

// ─────────────────────────────────────────────
// ENUMS & INTERFACES
// ─────────────────────────────────────────────

export type { LayoutType, SectionConfig, Session, Question };

export interface EnrichedMockTest extends Omit<MockTest, "questions"> {
  layoutType: LayoutType;
  questions: Question[];
  sections?: SectionConfig[];
  sessions?: Session[];
  specialties?: string[];
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function computeScore(
  answers: (number | null)[],
  questions: Question[],
  totalMarks: number,
  negativeMarking: number,
  sessionNoNegative?: boolean
) {
  let correct = 0, incorrect = 0, attempted = 0;
  answers.forEach((a, i) => {
    if (a !== null && questions[i]) {
      attempted++;
      if (a === questions[i].answer) correct++;
      else incorrect++;
    }
  });
  const perQ = questions.length > 0 ? totalMarks / questions.length : 0;
  const raw = correct * perQ;
  const neg = sessionNoNegative ? 0 : incorrect * negativeMarking;
  const score = Math.max(0, raw - neg);
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  return { correct, incorrect, attempted, score, neg, accuracy };
}

function normaliseTest(t: MockTest): EnrichedMockTest {
  const layoutType: LayoutType = (t.layoutType as LayoutType) || "STANDARD";

  const questions: Question[] = (t.questions || []).map((q) => ({
    q: q.q || "",
    options: q.options || [],
    answer: q.answer !== undefined ? q.answer : 0,
    sectionId: q.sectionId || "general",
    specialty: q.specialty,
    passage: q.passage
  }));

  return {
    ...t,
    layoutType,
    questions
  };
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

interface TimerProps { timeLeft: number; label?: string }
function Timer({ timeLeft, label }: TimerProps) {
  return (
    <div className={`mock-timer ${timeLeft <= 60 ? "warning" : ""}`}>
      {label && <span style={{ fontSize: 11, opacity: 0.7, marginRight: 6 }}>{label}</span>}
      {fmt(timeLeft)}
    </div>
  );
}

interface PaletteProps {
  questions: Question[];
  answers: (number | null)[];
  marked: Set<number>;
  idx: number;
  lockedIndices?: Set<number>;
  onSelect: (i: number) => void;
  sessionFilteredIndices?: number[];
}

function QuestionPalette({ questions, answers, marked, idx, lockedIndices, onSelect, sessionFilteredIndices }: PaletteProps) {
  const stats = useMemo(() => {
    let answeredCount = 0;
    let markedCount = 0;

    if (sessionFilteredIndices && sessionFilteredIndices.length > 0) {
      sessionFilteredIndices.forEach(i => {
        if (answers[i] !== null) answeredCount++;
        if (marked.has(i)) markedCount++;
      });
      const total = sessionFilteredIndices.length;
      return { answeredCount, markedCount, remaining: total - answeredCount };
    } else {
      questions.forEach((_, i) => {
        if (answers[i] !== null) answeredCount++;
        if (marked.has(i)) markedCount++;
      });
      const total = questions.length;
      return { answeredCount, markedCount, remaining: total - answeredCount };
    }
  }, [questions, answers, marked, sessionFilteredIndices]);

  return (
    <>
      <div className="mock-palette">
        {questions.map((_, i) => {
          const actualIndex = sessionFilteredIndices && sessionFilteredIndices[i] !== undefined
            ? sessionFilteredIndices[i]
            : i;

          const locked = lockedIndices?.has(actualIndex);
          const isCurrent = actualIndex === idx;
          const isAnswered = answers[actualIndex] !== null;
          const isMarked = marked.has(actualIndex);

          return (
            <div
              key={i}
              className={[
                "palette-item",
                isAnswered ? "answered" : "",
                isMarked ? "marked" : "",
                isCurrent ? "current" : "",
                locked ? "locked" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => !locked && onSelect(actualIndex)}
              style={
                isCurrent ? { background: "var(--clr-info)", color: "#fff" }
                  : isAnswered ? { background: "var(--clr-success)", color: "#fff" }
                    : isMarked ? { background: "var(--clr-warning)", color: "#fff" }
                      : undefined
              }
              title={locked ? "Section locked" : undefined}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="mock-legend" style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "16px" }}>
        <div className="mock-legend-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <div className="mock-legend-color" style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--clr-success)" }} />
          Answered ({stats.answeredCount})
        </div>
        <div className="mock-legend-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <div className="mock-legend-color" style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--clr-warning)" }} />
          Marked ({stats.markedCount})
        </div>
        <div className="mock-legend-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <div className="mock-legend-color" style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--clr-info)" }} />
          Current
        </div>
        <div className="mock-legend-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <div className="mock-legend-color" style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--surface-2, #ccc)", border: "1px solid var(--border, #999)" }} />
          Remaining ({stats.remaining})
        </div>
      </div>
    </>
  );
}

// SKELETON COMPONENT FOR LOADING STATES
function MockTestSkeleton() {
  return (
    <div className="mock-tests-grid">
      {[1, 2, 3].map((n) => (
        <div className="mock-test-card skeleton-animated" key={n} style={{ opacity: 0.7 }}>
          <div style={{ height: "24px", background: "var(--surface-2, #e0e0e0)", borderRadius: "4px", width: "70%", marginBottom: "12px" }}></div>
          <div style={{ height: "16px", background: "var(--surface-2, #e0e0e0)", borderRadius: "4px", width: "95%", marginBottom: "8px" }}></div>
          <div style={{ height: "16px", background: "var(--surface-2, #e0e0e0)", borderRadius: "4px", width: "50%", marginBottom: "20px" }}></div>
          <div className="mock-test-info" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: "32px", background: "var(--surface-2, #e0e0e0)", borderRadius: "6px" }}></div>
            ))}
          </div>
          <div style={{ height: "40px", background: "var(--surface-3, #d5d5d5)", borderRadius: "8px", marginTop: "16px" }}></div>
        </div>
      ))}
    </div>
  );
}

interface ResultScreenProps {
  test: EnrichedMockTest;
  answers: (number | null)[];
  timeLeft: number;
  onBack: () => void;
}
function ResultScreen({ test, answers, timeLeft, onBack }: ResultScreenProps) {
  const { correct, incorrect, attempted, score, neg, accuracy } = computeScore(
    answers, test.questions, test.total_marks, test.negativeMarking
  );
  const passed = score >= test.passingMarks;
  return (
    <div className="home-container">
      <div className="mock-result-screen">
        <h2>{test.title}</h2>
        <div className={`mock-pass-badge ${passed ? "pass" : "fail"}`}>
          {passed ? "✓ PASSED" : "✗ FAILED"}
        </div>
        <svg className="mock-score-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" stroke="var(--surface-2)" strokeWidth="14" fill="none" />
          <circle
            cx="100" cy="100" r="90"
            stroke={passed ? "url(#g2)" : "url(#g3)"}
            strokeWidth="14" fill="none" strokeLinecap="round"
            strokeDasharray={`${(score / test.total_marks) * 565} 565`}
            transform="rotate(-90 100 100)"
          />
          <defs>
            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#43e97b" /><stop offset="100%" stopColor="#38f9d7" />
            </linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5576c" /><stop offset="100%" stopColor="#ff6b6b" />
            </linearGradient>
          </defs>
          <text x="100" y="100" textAnchor="middle" dy=".3em" fontSize="36" fontWeight="800" fill="var(--text-main)">
            {score}/{test.total_marks}
          </text>
        </svg>
        <div className="mock-stats">
          <div className="mock-stat"><div className="mock-stat-value">{correct}</div><div className="mock-stat-label">Correct</div></div>
          <div className="mock-stat"><div className="mock-stat-value">{incorrect}</div><div className="mock-stat-label">Incorrect</div></div>
          <div className="mock-stat"><div className="mock-stat-value">{attempted}</div><div className="mock-stat-label">Attempted</div></div>
          <div className="mock-stat"><div className="mock-stat-value">{accuracy}%</div><div className="mock-stat-label">Accuracy</div></div>
          <div className="mock-stat"><div className="mock-stat-value">−{neg.toFixed(2)}</div><div className="mock-stat-label">Negative</div></div>
        </div>
        <h3 style={{ marginTop: 24, marginBottom: 12 }}>Question-wise Analysis</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="mock-analysis-table">
            <thead><tr><th>#</th><th>Section</th><th>Status</th><th>Your Answer</th><th>Correct</th></tr></thead>
            <tbody>
              {test.questions.map((q, i) => {
                const a = answers[i];
                const isCorrect = a === q.answer;
                const skipped = a === null;
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontSize: 12, opacity: 0.7 }}>{q.sectionId}</td>
                    <td>{skipped ? "Skipped" : isCorrect ? "✓ Correct" : "✗ Wrong"}</td>
                    <td>{a !== null ? String.fromCharCode(65 + a) : "—"}</td>
                    <td>{String.fromCharCode(65 + q.answer)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={onBack}>Back to Tests</button>
        </div>
      </div>
    </div>
  );
}

interface BranchSelectorProps {
  specialties: string[];
  onConfirm: (branch: string) => void;
  onExit: () => void;
  testTitle: string;
}
function BranchSelectorOverlay({ specialties, onConfirm, onExit, testTitle }: BranchSelectorProps) {
  const [selected, setSelected] = useState("");
  return (
    <div className="home-container">
      <div className="mock-overlay-card">
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚙️</div>
        <h2 style={{ marginBottom: 4 }}>{testTitle}</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, maxWidth: 440, textAlign: "center" }}>
          This is a GATE-style technical exam. Select your core branch to load your personalised question set (General Aptitude + Branch-specific questions).
        </p>
        <div style={{ marginBottom: 20, width: "100%", maxWidth: 320 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
            Select Branch / Specialty
          </label>
          <select
            className="mock-select"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">— Choose your branch —</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={onExit}>Cancel</button>
          <button className="btn btn-primary" disabled={!selected} onClick={() => onConfirm(selected)}>
            Load My Exam
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function MockTestPage() {
  const { user, requireAuth } = useAuth();
  const { showToast } = useToast();

  // ── Test selection & Listing Filters ────────
  const [mockTests, setMockTests] = useState<EnrichedMockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Tracking state for skeleton loader
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [test, setTest] = useState<EnrichedMockTest | null>(null);

  // ── Core test state ─────────────────────────
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const savedRef = useRef(false);

  // ── STANDARD / MULTI_SESSION global timer ───
  const [timeLeft, setTimeLeft] = useState(0);

  // ── SECTIONAL_LOCK: per-section timer & locks ─
  const [currentSection, setCurrentSection] = useState<string>("");
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());

  // ── MULTI_SESSION state ─────────────────────
  const [activeSession, setActiveSession] = useState<number>(0);
  const [sessionLocked, setSessionLocked] = useState<Set<number>>(new Set());

  // ── TECH_SPLIT state ────────────────────────
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [filteredIndices, setFilteredIndices] = useState<number[]>([]);

  // ─────────────────────────────────────────────
  // LOAD TESTS
  // ─────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const t = await examApi.getMockTests();
        if (t && t.length) {
          setMockTests(t.map(normaliseTest));
        } else {
          return
        }
      } catch (err) {
        console.error("Failed fetching list, loading fallback:", err);
        return
      } finally {
        setIsLoading(false); // Disable loading skeleton
      }
    })();
  }, []);

  // ─────────────────────────────────────────────
  // DERIVED / MEMOIZED VALUES
  // ─────────────────────────────────────────────

  const categories = useMemo(() => {
    const list = mockTests.map(t => t.category).filter(Boolean);
    return Array.from(new Set(list));
  }, [mockTests]);

  const filteredTests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return mockTests.filter(t => {
      const matchesTitle = t.title.toLowerCase().includes(query);
      const matchesDescription = t.description ? t.description.toLowerCase().includes(query) : false;

      const matchesSpecialties = t.specialties && Array.isArray(t.specialties)
        ? t.specialties.some(spec => spec.toLowerCase().includes(query))
        : false;

      const matchesSearch = matchesTitle || matchesDescription || matchesSpecialties;
      const matchesCategory = selectedCategory === "" || t.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [mockTests, searchQuery, selectedCategory]);

  const activeQuestions = useMemo<Question[]>(() => {
    if (!test) return [];
    if (test.layoutType === "TECH_SPLIT" && filteredIndices.length > 0) {
      return filteredIndices.map(i => test.questions[i]).filter(Boolean);
    }
    return test.questions;
  }, [test, filteredIndices]);

  const activeAnswers = useMemo<(number | null)[]>(() => {
    if (!test) return [];
    if (test.layoutType === "TECH_SPLIT" && filteredIndices.length > 0) {
      return filteredIndices.map(i => answers[i]);
    }
    return answers;
  }, [test, filteredIndices, answers]);

  const lockedPaletteIndices = useMemo<Set<number>>(() => {
    if (!test || test.layoutType !== "SECTIONAL_LOCK") return new Set();
    const locked = new Set<number>();
    test.questions.forEach((q, i) => {
      if (lockedSections.has(q.sectionId)) {
        locked.add(i);
      }
    });
    return locked;
  }, [test, lockedSections]);

  const sessionQuestionIndices = useMemo<number[]>(() => {
    if (!test || test.layoutType !== "MULTI_SESSION" || !test.sessions || test.sessions.length === 0) return [];

    const session = test.sessions[activeSession];
    if (!session) return [];

    let matchedIndices: number[] = [];
    if (session.sectionIds && session.sectionIds.length > 0) {
      matchedIndices = test.questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q && q.sectionId && session.sectionIds.includes(q.sectionId))
        .map(({ i }) => i);
    }

    if (matchedIndices.length === 0) {
      const totalQuestions = test.questions.length;
      const totalSessions = test.sessions.length;
      const chunkSize = Math.ceil(totalQuestions / totalSessions);

      const startIdx = activeSession * chunkSize;
      const endIdx = Math.min(startIdx + chunkSize, totalQuestions);

      const chunkIndices: number[] = [];
      for (let i = startIdx; i < endIdx; i++) {
        chunkIndices.push(i);
      }
      return chunkIndices;
    }

    return matchedIndices;
  }, [test, activeSession]);

  const activeSessionConfig = useMemo(() => {
    if (!test?.sessions) return null;
    return test.sessions[activeSession] ?? null;
  }, [test, activeSession]);

  const effectiveNegative = useMemo(() => {
    if (!test) return 0;
    if (test.layoutType === "MULTI_SESSION" && activeSessionConfig?.noNegative) return 0;
    return test.negativeMarking;
  }, [test, activeSession, activeSessionConfig]);

  // ─────────────────────────────────────────────
  // START TEST
  // ─────────────────────────────────────────────

  const startTest = useCallback(async (t: EnrichedMockTest) => {
    if (!requireAuth()) return;

    try {
      showToast("Fetching actual question paper...", "info");
      const fullTestData = await examApi.getMockTestQuestions(t.id);

      if (!fullTestData || !fullTestData.questions || fullTestData.questions.length === 0) {
        showToast("Questions for this exam are not available on the server yet!", "warning");
        return;
      }

      const normalisedQuestions = fullTestData.questions.map((q: any) => ({
        q: q.q || "",
        options: q.options || [],
        answer: q.answer !== undefined ? q.answer : 0,
        sectionId: q.sectionId || "general",
        specialty: q.specialty,
        passage: q.passage
      }));

      const enrichedTest: EnrichedMockTest = {
        ...t,
        questions: normalisedQuestions
      };

      setTest(enrichedTest);
      setIdx(0);
      setAnswers(new Array(enrichedTest.questions.length).fill(null));
      setMarked(new Set());
      setShowResult(false);
      savedRef.current = false;
      setLockedSections(new Set());
      setActiveSession(0);
      setSessionLocked(new Set());
      setSelectedBranch("");
      setFilteredIndices([]);

      if (enrichedTest.layoutType === "TECH_SPLIT") {
        setShowBranchSelector(true);
        return;
      }

      if (enrichedTest.layoutType === "SECTIONAL_LOCK" && enrichedTest.sections?.length) {
        const firstSection = enrichedTest.sections[0];
        setCurrentSection(firstSection.id);
        setSectionTimeLeft(firstSection.duration * 60);
      } else {
        setTimeLeft(enrichedTest.duration * 60);
      }

      showToast("Test Started! All the best.", "success");

    } catch (error: any) {
      console.error("Failed to load layout questions:", error);
      showToast(`Error: ${ "Sorry test is not available for this exam. It will available soon..."}`, "error");
    }
  }, [requireAuth, showToast]);

  const confirmBranch = useCallback((branch: string) => {
    if (!test) return;
    setSelectedBranch(branch);
    setShowBranchSelector(false);

    const indices = test.questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => !q.specialty || q.specialty.toLowerCase() === branch.toLowerCase())
      .map(({ i }) => i);
    setFilteredIndices(indices);
    setTimeLeft(test.duration * 60);
  }, [test]);

  // ─────────────────────────────────────────────
  // TIMERS
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!test || showResult) return;
    if (test.layoutType === "SECTIONAL_LOCK") return;
    if (test.layoutType === "TECH_SPLIT" && showBranchSelector) return;
    if (timeLeft <= 0) { finishTest(); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [test, showResult, timeLeft, showBranchSelector]);

  useEffect(() => {
    if (!test || showResult || test.layoutType !== "SECTIONAL_LOCK") return;
    if (sectionTimeLeft <= 0) {
      advanceSection();
      return;
    }
    const t = setTimeout(() => setSectionTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [test, showResult, sectionTimeLeft]);

  const advanceSection = useCallback(() => {
    if (!test?.sections) return;
    const sectionIds = test.sections.map(s => s.id);
    const currentIdx = sectionIds.indexOf(currentSection);

    setLockedSections(prev => new Set([...prev, currentSection]));

    if (currentIdx < sectionIds.length - 1) {
      const nextSection = test.sections[currentIdx + 1];
      setCurrentSection(nextSection.id);
      setSectionTimeLeft(nextSection.duration * 60);
      const firstQIdx = test.questions.findIndex(q => q.sectionId === nextSection.id);
      if (firstQIdx !== -1) setIdx(firstQIdx);
      showToast(`Section "${test.sections[currentIdx].label}" locked. Moving to "${nextSection.label}".`, "info");
    } else {
      finishTest();
    }
  }, [test, currentSection, showToast]);

  const submitSession = useCallback(() => {
    if (!test?.sessions) return;
    setSessionLocked(prev => new Set([...prev, activeSession]));
    const nextSession = activeSession + 1;
    if (nextSession < test.sessions.length) {
      setActiveSession(nextSession);
      const nextSessionConfig = test.sessions[nextSession];
      const firstQIdx = test.questions.findIndex(q => nextSessionConfig.sectionIds?.includes(q.sectionId));
      setIdx(firstQIdx !== -1 ? firstQIdx : 0);
      showToast(`Session ${activeSession + 1} submitted. Session ${nextSession + 1} is now active.`, "success");
    } else {
      finishTest();
    }
  }, [test, activeSession, showToast]);

  const finishTest = useCallback(async () => {
    if (!test || savedRef.current) return;
    savedRef.current = true;
    setShowResult(true);

    const { correct, incorrect, attempted, score, accuracy } = computeScore(
      answers, test.questions, test.total_marks, effectiveNegative
    );
    const passed = score >= test.passingMarks;
    const timeSpent = test.duration * 60 - timeLeft;

    if (user) {
      const db = getFirebaseDB();
      if (db) {
        try {
          await addDoc(collection(db, "mockResults"), {
            uid: user.uid,
            testId: test.id,
            testTitle: test.title,
            layoutType: test.layoutType,
            total_questions: test.total_questions,
            attempted, correct, incorrect, score,
            total_marks: test.total_marks,
            accuracy, timeSpent, passed,
            createdAt: serverTimestamp(),
          } as MockResult);
          showToast(`Result saved: ${passed ? "PASSED" : "FAILED"}`, passed ? "success" : "warning");
        } catch {
          showToast("Score computed (could not save)", "warning");
        }
      }
    } else {
      showToast(`Score: ${score} (${passed ? "PASSED" : "FAILED"})`, "info");
    }
  }, [test, answers, timeLeft, user, showToast, effectiveNegative]);

  // ─────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────

  const handleAnswer = useCallback((optionIdx: number) => {
    if (!test) return;
    if (test.layoutType === "TECH_SPLIT" && filteredIndices.length > 0) {
      const realIdx = filteredIndices[idx];
      setAnswers(prev => { const n = [...prev]; n[realIdx] = optionIdx; return n; });
    } else {
      setAnswers(prev => { const n = [...prev]; n[idx] = optionIdx; return n; });
    }
  }, [test, idx, filteredIndices]);

  const handleMark = useCallback(() => {
    const realIdx = (test?.layoutType === "TECH_SPLIT" && filteredIndices.length > 0)
      ? filteredIndices[idx]
      : idx;
    setMarked(prev => {
      const n = new Set(prev);
      n.has(realIdx) ? n.delete(realIdx) : n.add(realIdx);
      return n;
    });
  }, [test, idx, filteredIndices]);

  const handleSelectPalette = useCallback((i: number) => {
    if (test?.layoutType === "SECTIONAL_LOCK") {
      if (lockedPaletteIndices.has(i)) return;
    }
    if (test?.layoutType === "MULTI_SESSION") {
      if (!sessionQuestionIndices.includes(i)) return;
    }
    setIdx(i);
  }, [test, lockedPaletteIndices, sessionQuestionIndices]);

  const handleNext = useCallback(() => {
    if (!test) return;

    if (test.layoutType === "MULTI_SESSION") {
      const currentRelativeIdx = sessionQuestionIndices.indexOf(idx);
      if (currentRelativeIdx < sessionQuestionIndices.length - 1) {
        setIdx(sessionQuestionIndices[currentRelativeIdx + 1]);
      }
      return;
    }

    const total = test.layoutType === "TECH_SPLIT"
      ? filteredIndices.length
      : (test.questions.length ?? 0);
    if (idx < total - 1) setIdx(i => i + 1);
  }, [test, idx, filteredIndices, sessionQuestionIndices]);

  const handlePrev = useCallback(() => {
    if (!test) return;

    if (test.layoutType === "MULTI_SESSION") {
      const currentRelativeIdx = sessionQuestionIndices.indexOf(idx);
      if (currentRelativeIdx > 0) {
        setIdx(sessionQuestionIndices[currentRelativeIdx - 1]);
      }
      return;
    }

    if (idx > 0) setIdx(i => i - 1);
  }, [test, idx, sessionQuestionIndices]);

  // ─────────────────────────────────────────────
  // CURRENT QUESTION RESOLVED
  // ─────────────────────────────────────────────

  const currentQuestion = useMemo<Question | null>(() => {
    if (!test) return null;
    if (test.layoutType === "TECH_SPLIT" && filteredIndices.length > 0) {
      return test.questions[filteredIndices[idx]] ?? null;
    }
    return test.questions[idx] ?? null;
  }, [test, idx, filteredIndices]);

  const currentAnswer = useMemo<number | null>(() => {
    if (!test) return null;
    if (test.layoutType === "TECH_SPLIT" && filteredIndices.length > 0) {
      return answers[filteredIndices[idx]] ?? null;
    }
    return answers[idx] ?? null;
  }, [test, idx, filteredIndices, answers]);

  const totalActive = test?.layoutType === "TECH_SPLIT" && filteredIndices.length > 0
    ? filteredIndices.length
    : (test?.questions.length ?? 0);

  // ─────────────────────────────────────────────
  // RENDER: TEST LIST WITH ADVANCED SEARCH
  // ─────────────────────────────────────────────

  if (!test) {
    return (
      <div className="home-container">
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "20px 0" }}>📋 Mock Tests</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Attempt real exam pattern tests with negative marking and timed sessions.
        </p>

        <div style={{
          display: "flex",
          gap: "16px",
          marginBottom: "28px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{ flex: "1 1 300px" }}>
            <input
              type="text"
              placeholder="🔍 Search by name, description or branch..."
              className="mock-select"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ width: "200px" }}>
            <select
              className="mock-select"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONDITIONALLY RENDER LOADING SKELETON GRID OR DATA */}
        {isLoading ? (
          <MockTestSkeleton />
        ) : filteredTests.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px",
            background: "var(--surface-1)",
            border: "1px dashed var(--border)",
            borderRadius: "12px",
            color: "var(--text-muted)"
          }}>
            No mock tests found matching your filtering parameters.
          </div>
        ) : (
          <div className="mock-tests-grid">
            {filteredTests.map(t => (
              <div className="mock-test-card" key={t.id}>
                <div className="mock-test-title">{t.title}</div>
                <div className="mock-test-desc">{t.description}</div>
                {t.layoutType && t.layoutType !== "STANDARD" && (
                  <div className="mock-layout-badge" data-type={t.layoutType}>
                    {t.layoutType.replace("_", " ")}
                  </div>
                )}
                <div className="mock-test-info">
                  <div className="mock-test-info-item"><div className="label">Duration</div><div className="value">{t.duration} min</div></div>
                  <div className="mock-test-info-item"><div className="label">Questions</div><div className="value">{t.total_questions}</div></div>
                  <div className="mock-test-info-item"><div className="label">Total Marks</div><div className="value">{t.total_marks}</div></div>
                  <div className="mock-test-info-item"><div className="label">Negative</div><div className="value">−{t.negativeMarking}</div></div>
                  <div className="mock-test-info-item"><div className="label">Pass Marks</div><div className="value">{t.passingMarks}</div></div>
                  <div className="mock-test-info-item"><div className="label">Category</div><div className="value">{t.category}</div></div>
                </div>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => startTest(t)}>
                  Start Test
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (test.layoutType === "TECH_SPLIT" && showBranchSelector) {
    return (
      <BranchSelectorOverlay
        specialties={test.specialties ?? []}
        testTitle={test.title}
        onConfirm={confirmBranch}
        onExit={() => setTest(null)}
      />
    );
  }

  if (showResult) {
    return <ResultScreen test={test} answers={answers} timeLeft={timeLeft} onBack={() => setTest(null)} />;
  }

  if (!currentQuestion) return null;

  // ─────────────────────────────────────────────
  // RENDER: ACTIVE TEST LAYOUTS
  // ─────────────────────────────────────────────

  const QuestionBlock = () => (
    <div className="mock-question">
      <div className="mock-q-text">{currentQuestion.q}</div>
      <div className="mock-options">
        {(currentQuestion.options || []).map((opt, i) => (
          <div
            key={i}
            className={`mock-option ${currentAnswer === i ? "selected" : ""}`}
            onClick={() => handleAnswer(i)}
          >
            <div className="mock-option-letter">{String.fromCharCode(65 + i)}</div>
            <div>{opt}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const NavButtons = ({ isLastQ }: { isLastQ: boolean }) => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 }}>
      <button className="btn btn-secondary" onClick={() => setTest(null)}>Exit</button>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={handleMark}>
          {marked.has((test?.layoutType === "TECH_SPLIT" && filteredIndices.length > 0) ? filteredIndices[idx] : idx) ? "Unmark" : "Mark"}
        </button>
        <button className="btn btn-secondary" disabled={idx === 0} onClick={handlePrev}>Previous</button>
        {isLastQ ? (
          <button className="btn btn-success" onClick={() => setConfirm(true)}>Submit Test</button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>Save & Next</button>
        )}
      </div>
    </div>
  );

  // ── STANDARD LAYOUT ──
  if (test.layoutType === "STANDARD") {
    return (
      <div className="home-container">
        <div className="mock-container">
          <div className="mock-progress">
            <span>Q{idx + 1} of {totalActive}</span>
            <Timer timeLeft={timeLeft} />
          </div>
          <div className="mock-layout">
            <div>
              <QuestionBlock />
              <NavButtons isLastQ={idx === totalActive - 1} />
            </div>
            <div className="mock-sidebar">
              <QuestionPalette
                questions={activeQuestions}
                answers={activeAnswers}
                marked={marked}
                idx={idx}
                onSelect={setIdx}
              />
            </div>
          </div>
        </div>
        <ConfirmModal
          open={confirm} title="Submit Test?"
          message="You will not be able to change your answers after submitting."
          confirmText="Submit"
          onConfirm={() => { setConfirm(false); finishTest(); }}
          onCancel={() => setConfirm(false)}
        />
      </div>
    );
  }

  // ── SECTIONAL_LOCK LAYOUT ──
  if (test.layoutType === "SECTIONAL_LOCK") {
    const sectionLabel = test.sections?.find(s => s.id === currentSection)?.label ?? currentSection;
    const isLastSection = test.sections ? currentSection === test.sections[test.sections.length - 1].id : true;

    return (
      <div className="home-container">
        <div className="mock-container">
          <div className="mock-progress">
            <div>
              <span style={{ fontWeight: 700 }}>Section: {sectionLabel}</span>
              <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 13 }}>
                Q{idx + 1} of {test.questions.length}
              </span>
            </div>
            <Timer timeLeft={sectionTimeLeft} label={`${sectionLabel} Timer`} />
          </div>

          <div className="mock-section-tabs">
            {test.sections?.map(s => (
              <div
                key={s.id}
                className={[
                  "mock-section-tab",
                  s.id === currentSection ? "active" : "",
                  lockedSections.has(s.id) ? "locked" : "",
                ].filter(Boolean).join(" ")}
              >
                {lockedSections.has(s.id) ? "🔒 " : ""}{s.label}
                {s.id === currentSection && <span className="tab-indicator" />}
              </div>
            ))}
          </div>

          <div className="mock-layout">
            <div>
              <QuestionBlock />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 }}>
                <button className="btn btn-secondary" onClick={() => setTest(null)}>Exit</button>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" onClick={handleMark}>
                    {marked.has(idx) ? "Unmark" : "Mark"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={idx === 0 || lockedPaletteIndices.has(idx - 1)}
                    onClick={handlePrev}
                  >Previous</button>
                  {isLastSection && idx === test.questions.length - 1 ? (
                    <button className="btn btn-success" onClick={() => setConfirm(true)}>Submit Test</button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNext}>Save & Next</button>
                  )}
                  <button className="btn btn-warning" onClick={() => setConfirm(true)}>
                    {isLastSection ? "Submit Test" : "Submit Section"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mock-sidebar">
              <QuestionPalette
                questions={test.questions}
                answers={answers}
                marked={marked}
                idx={idx}
                lockedIndices={lockedPaletteIndices}
                onSelect={handleSelectPalette}
              />
            </div>
          </div>
        </div>
        <ConfirmModal
          open={confirm}
          title={isLastSection ? "Submit Test?" : `Submit Section "${sectionLabel}"?`}
          message={isLastSection ? "This will end your exam." : "This section will be locked and you cannot return."}
          confirmText={isLastSection ? "Submit Test" : "Lock & Continue"}
          onConfirm={() => {
            setConfirm(false);
            isLastSection ? finishTest() : advanceSection();
          }}
          onCancel={() => setConfirm(false)}
        />
      </div>
    );
  }

  // ── MULTI_SESSION LAYOUT (FIXED & POLISHED IDENTIFIER) ──
  if (test.layoutType === "MULTI_SESSION") {
    const isLastSession = activeSession === (test.sessions?.length ?? 1) - 1;

    const safeSessionIndices = sessionQuestionIndices && sessionQuestionIndices.length > 0
      ? sessionQuestionIndices
      : test.questions.map((_, i) => i);

    const currentSessionQuestions = test.questions.filter((_, i) => safeSessionIndices.includes(i));

    let currentRelativeIdx = safeSessionIndices.indexOf(idx);
    if (currentRelativeIdx === -1 && safeSessionIndices.length > 0) {
      currentRelativeIdx = 0;
    }

    return (
      <div className="home-container">
        <div className="mock-container">

          {/* RE-ENGINEERED SESSION IDENTIFIER ROW */}
          <div className="mock-progress" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch", borderBottom: "2px solid var(--border, #eee)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "8px" }}>

              <div className="mock-section-tabs" style={{
                marginTop: "14px",
                display: "flex",     // Yeh row mein laane ke liye
                flexDirection: "row",
                gap: "10px"          // Buttons ke beech space
              }}>
                {test.sessions?.map((s, si) => {
                  const isLocked = sessionLocked.has(si);
                  const isActive = si === activeSession;
                  const isUpcoming = si > activeSession;

                  return (
                    <div
                      key={s.id}
                      className={[
                        "mock-section-tab",
                        isActive ? "active" : "",
                        isLocked ? "locked" : "",
                        isUpcoming ? "disabled" : ""
                      ].filter(Boolean).join(" ")}
                    >
                      {/* Yahan icon change kiya hai matching look ke liye */}
                      <span style={{ marginRight: '6px' }}>
                        {isLocked ? "🔒" : isActive ? "⏱️" : "🔒"}
                      </span>
                      {s.label || `Session ${si + 1}`}
                    </div>
                  );
                })}
              </div>
              {/* Right Segment: Global Clock */}
              <Timer timeLeft={timeLeft} />
            </div>
          </div>

          <div style={{ display: "flex", marginBottom: "10px", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

            <div style={{
              background: "var(--surface-2, #f5f5f5)",
              color: "var(--text-main, #333)",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              border: "1px solid var(--border, #ccc)"
            }}>
              Question <span style={{ color: "var(--clr-primary, #6200ee)", fontSize: "15px", fontWeight: "800" }}>{currentRelativeIdx + 1}</span> of {safeSessionIndices.length}
            </div>

            {activeSessionConfig?.noNegative && (
              <div style={{
                background: "#e8f5e9",
                color: "#2e7d32",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                border: "1px solid #a5d6a7"
              }}>
                🛡️ No Negative Marking
              </div>
            )}
          </div>

          <div className="mock-layout">
            <div>
              <QuestionBlock />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 }}>
                <button className="btn btn-secondary" onClick={() => setTest(null)}>Exit</button>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" onClick={handleMark}>
                    {marked.has(idx) ? "Unmark" : "Mark"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={currentRelativeIdx === 0}
                    onClick={() => setIdx(safeSessionIndices[currentRelativeIdx - 1])}
                  >
                    Previous
                  </button>
                  {currentRelativeIdx < safeSessionIndices.length - 1 ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setIdx(safeSessionIndices[currentRelativeIdx + 1])}
                    >
                      Save & Next
                    </button>
                  ) : isLastSession ? (
                    <button className="btn btn-success" onClick={() => setConfirm(true)}>Submit Test</button>
                  ) : (
                    <button className="btn btn-warning" onClick={() => setConfirm(true)}>
                      Submit {activeSessionConfig?.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mock-sidebar">
              <div className="mock-session-palette-header" style={{ marginBottom: 12, fontWeight: 600, fontSize: "14px" }}>
                {activeSessionConfig?.label ?? "Session"} Questions
              </div>

              <QuestionPalette
                questions={currentSessionQuestions}
                answers={answers}
                marked={marked}
                idx={idx}
                onSelect={handleSelectPalette}
                sessionFilteredIndices={safeSessionIndices}
              />
            </div>
          </div>
        </div>
        <ConfirmModal
          open={confirm}
          title={isLastSession ? "Submit Test?" : `Submit ${activeSessionConfig?.label}?`}
          message={isLastSession ? "This will end your exam." : "Once submitted, you cannot return to this session. Next session will begin instantly."}
          confirmText={isLastSession ? "Submit Test" : "Submit & Continue"}
          onConfirm={() => {
            setConfirm(false);
            isLastSession ? finishTest() : submitSession();
          }}
          onCancel={() => setConfirm(false)}
        />
      </div>
    );
  }

  // ── TECH_SPLIT LAYOUT ──
  if (test.layoutType === "TECH_SPLIT") {
    return (
      <div className="home-container">
        <div className="mock-container">
          <div className="mock-progress">
            <div>
              <span>Q{idx + 1} of {totalActive}</span>
              <span className="mock-badge-blue" style={{ marginLeft: 10 }}>
                Branch: {selectedBranch.charAt(0).toUpperCase() + selectedBranch.slice(1)}
              </span>
              <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>
                ({currentQuestion.specialty ? "Technical" : "General Aptitude"})
              </span>
            </div>
            <Timer timeLeft={timeLeft} />
          </div>
          <div className="mock-layout">
            <div>
              <QuestionBlock />
              <NavButtons isLastQ={idx === totalActive - 1} />
            </div>
            <div className="mock-sidebar">
              <QuestionPalette
                questions={activeQuestions}
                answers={answers}
                marked={marked}
                idx={filteredIndices[idx]}
                onSelect={(actualI) => setIdx(filteredIndices.indexOf(actualI))}
                sessionFilteredIndices={filteredIndices}
              />
            </div>
          </div>
        </div>
        <ConfirmModal
          open={confirm} title="Submit Test?"
          message="You will not be able to change your answers after submitting."
          confirmText="Submit"
          onConfirm={() => { setConfirm(false); finishTest(); }}
          onCancel={() => setConfirm(false)}
        />
      </div>
    );
  }

  // ── PASSAGE_SPLIT LAYOUT ──
  if (test.layoutType === "PASSAGE_SPLIT") {
    return (
      <div className="home-container">
        <div className="mock-container">
          <div className="mock-progress">
            <span>Q{idx + 1} of {totalActive}</span>
            <Timer timeLeft={timeLeft} />
          </div>

          <div className="mock-passage-split">
            <div className="mock-passage-pane">
              <div className="mock-passage-label">📄 Reading Passage</div>
              <div className="mock-passage-text">
                {currentQuestion.passage
                  ? currentQuestion.passage
                  : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No passage for this question.</span>
                }
              </div>
            </div>

            <div className="mock-question-pane">
              <QuestionBlock />
              <NavButtons isLastQ={idx === totalActive - 1} />
            </div>
          </div>

          <div className="mock-passage-palette-row">
            <QuestionPalette
              questions={activeQuestions}
              answers={answers}
              marked={marked}
              idx={idx}
              onSelect={setIdx}
            />
          </div>
        </div>
        <ConfirmModal
          open={confirm} title="Submit Test?"
          message="You will not be able to change your answers after submitting."
          confirmText="Submit"
          onConfirm={() => { setConfirm(false); finishTest(); }}
          onCancel={() => setConfirm(false)}
        />
      </div>
    );
  }

  return null;
}