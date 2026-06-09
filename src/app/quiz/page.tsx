"use client";
import { useEffect, useState, useRef } from "react";
import { examApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getFirebaseDB } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { QuizTopic, QuizResult } from "@/types";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function QuizPage() {
  const { user, requireAuth } = useAuth();
  const { showToast } = useToast();
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [topic, setTopic] = useState<QuizTopic | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExp, setShowExp] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const savedRef = useRef(false);

  const startQuiz = (t: QuizTopic) => {
    if (!requireAuth()) return;
    setTopic(t); setIdx(0); setAnswers(new Array(t.questions.length).fill(null));
    setTimeLeft(30 * t.questions.length); setShowExp(false); setShowResult(false); savedRef.current = false;
  };
  const finish = async () => {
    if (!topic || savedRef.current) return;
    savedRef.current = true; setShowResult(true);
    let correct = 0, incorrect = 0;
    answers.forEach((a, i) => { if (a === null) return; if (a === topic.questions[i].answer) correct++; else incorrect++; });
    const score = correct * 10;
    if (user) {
      const db = getFirebaseDB();
      if (db) {
        try {
          await addDoc(collection(db, "quizResults"), { uid: user.uid, topic: topic.name, total_questions: topic.questions.length, correct, incorrect, skipped: topic.questions.length - correct - incorrect, score, accuracy: Math.round((correct / topic.questions.length) * 100), timeSpent: (30 * topic.questions.length) - timeLeft, createdAt: serverTimestamp() } as QuizResult);
          showToast(`Score saved: ${score}`, "success");
        } catch { showToast("Score computed (could not save)", "warning"); }
      }
    } else { showToast(`Score: ${score}`, "info"); }
  };
  // Use a ref so the timer's setTimeout always calls the latest `finish`
  // (avoids stale-closure issues when the dependency array would otherwise
  // need to include the function reference).
  const finishRef = useRef<() => void>(() => { });
  finishRef.current = finish;

  useEffect(() => {
    if (!topic || showResult) return;
    if (timeLeft <= 0) { finishRef.current(); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [topic, timeLeft, showResult]);



 useEffect(() => {
  (async () => {
    try {
      // Ab 'response' seedha QuizTopic[] ki array hai
      const response = await examApi.getQuizTopics(); 
      
      // Direct array ki length check karein
      if (response && response.length) {
        setTopics(response); // Sahi array state mein set ho gayi 🎉
      } else {
        const { topics: fallback } = await import("@/data/sampleData");
        setTopics(fallback);
      }
    } catch (error) {
      console.error("Quiz fetch failed:", error);
      const { topics: fallback } = await import("@/data/sampleData");
      setTopics(fallback);
    }
  })();
}, []);

  if (!topic) {
    return (
      <div className="home-container">
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "20px 0" }}>📝 Daily Quiz</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Pick a topic and test your knowledge. 30 seconds per question.</p>
        <div className="quiz-topics-grid">
          {topics.map((t: QuizTopic) => (
            <div key={t.id} className="quiz-topic-card" onClick={() => startQuiz(t)}>
              <div className="quiz-topic-icon" style={{ background: `linear-gradient(135deg, ${t.color}, #764ba2)`, width: 64, height: 64, borderRadius: 16, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{t.icon}</div>
              <div className="quiz-topic-name">{t.name}</div>
              <div className="quiz-topic-count">{t.questions.length} questions</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showResult) {
    const correct = answers.filter((a, i) => a === topic.questions[i].answer).length;
    const accuracy = Math.round((correct / topic.questions.length) * 100);
    const score = correct * 10;
    const incorrect = answers.filter(a => a !== null).length - correct;
    const skipped = topic.questions.length - answers.filter(a => a !== null).length;
    return (
      <div className="home-container">
        <div className="quiz-result-screen">
          <h2>Quiz Complete! 🎉</h2>
          <svg className="quiz-score-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" stroke="var(--surface-2)" strokeWidth="14" fill="none" />
            <circle cx="100" cy="100" r="90" stroke="url(#g1)" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={`${(accuracy / 100) * 565} 565`} transform="rotate(-90 100 100)" />
            <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#667eea" /><stop offset="100%" stopColor="#764ba2" /></linearGradient></defs>
            <text x="100" y="100" textAnchor="middle" dy=".3em" fontSize="42" fontWeight="800" fill="var(--text-main)">{accuracy}%</text>
          </svg>
          <div className="quiz-stats">
            <div className="quiz-stat"><div className="quiz-stat-value">{score}</div><div className="quiz-stat-label">Total Score</div></div>
            <div className="quiz-stat"><div className="quiz-stat-value">{correct}</div><div className="quiz-stat-label">Correct</div></div>
            <div className="quiz-stat"><div className="quiz-stat-value">{incorrect}</div><div className="quiz-stat-label">Incorrect</div></div>
            <div className="quiz-stat"><div className="quiz-stat-value">{skipped}</div><div className="quiz-stat-label">Skipped</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => setTopic(null)}>Back to Topics</button>
            <button className="btn btn-primary" onClick={() => startQuiz(topic)}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const q = topic.questions[idx];
  const selected = answers[idx];
  return (
    <div className="home-container">
      <div className="quiz-container" key={topic.id + idx}>
        <div className="quiz-progress">
          <span>Question {idx + 1} of {topic.questions.length}</span>
          <div className={`quiz-timer ${timeLeft <= 30 ? "warning" : ""}`}>{fmt(timeLeft)}</div>
        </div>
        <div className="quiz-question">
          <div className="quiz-q-text">{q.q}</div>
          <div className="quiz-options">
            {q.options.map((opt, i) => (
              <div key={i} className={`quiz-option ${selected === i ? "selected" : ""} ${showExp && i === q.answer ? "correct" : ""} ${showExp && selected === i && i !== q.answer ? "incorrect" : ""}`} onClick={() => !showExp && setAnswers(p => { const n = [...p]; n[idx] = i; return n; })}>
                <div className="quiz-option-letter">{String.fromCharCode(65 + i)}</div>
                <div>{opt}</div>
              </div>
            ))}
          </div>
          {showExp && <div className="quiz-explanation"><h4>Explanation</h4><p>{q.explanation}</p></div>}
        </div>
        <div className="quiz-palette" style={{ marginBottom: 20 }}>
          {topic.questions.map((_, i) => (
            <div key={i} className={`palette-item ${answers[i] !== null ? "answered" : ""} ${i === idx ? "current" : ""}`} onClick={() => { setIdx(i); setShowExp(false); }}>{i + 1}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => setTopic(null)}>Exit</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" disabled={idx === 0} onClick={() => { setIdx(i => i - 1); setShowExp(false); }}>Previous</button>
            {selected !== null && !showExp && <button className="btn btn-primary" onClick={() => setShowExp(true)}>Submit Answer</button>}
            {idx < topic.questions.length - 1 ? <button className="btn btn-primary" onClick={() => { setIdx(i => i + 1); setShowExp(false); }}>Next →</button> : <button className="btn btn-success" onClick={finish}>Finish</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
