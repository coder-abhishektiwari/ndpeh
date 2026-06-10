"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { examApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { LoadingOverlay } from "@/components/ui/Skeletons";
import { formatEligibility, formatAgeLimit, safeText } from "@/lib/format";
import type { Paper, ExamSection } from "@/types";

const PDF_STEPS = ["Gathering paper data...", "Rendering question tables...", "Generating PDF document..."];

export default function ExamQuestionsPage() {
  const params = useParams<{ paperId: string }>();
  const { showToast } = useToast();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStep, setPdfStep] = useState(0);

  useEffect(() => {
    if (!params?.paperId) return;
    let active = true;
    (async () => {
      try {
        const p = await examApi.getPaper(decodeURIComponent(params.paperId));
        if (!active) return;
        setPaper(p);
        if (p.sections && p.sections.length) setActiveSection(0);
      } catch {
        if (active) showToast("Could not load paper", "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [params?.paperId, showToast]);

  const handleDownload = async () => {
    if (!paper) return;
    setPdfLoading(true); setPdfStep(0);
    let stepInterval: ReturnType<typeof setInterval> | null = null;
    try {
      stepInterval = setInterval(() => setPdfStep(s => Math.min(s + 1, PDF_STEPS.length - 1)), 1200);
      // Try server-side conversion first
      try {
        const res = await fetch(`${examApi.baseUrl}/generate-pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: paper.exam_name, sections: paper.sections || [], exam_board: paper.exam_board, exam_date: paper.exam_date }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `${paper.exam_name.replace(/[^a-z0-9]+/gi, "_")}.pdf`;
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(url);
          if (stepInterval) clearInterval(stepInterval);
          showToast("PDF downloaded!", "success");
          return;
        }
      } catch { /* fall through to client-side */ }

      // Fallback: dynamic import html2pdf (client-only)
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("paper-content");
      if (!element) throw new Error("Content not found");
      await html2pdf().set({ margin: 10, filename: `${paper.exam_name}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(element).save();
      if (stepInterval) clearInterval(stepInterval);
      showToast("PDF downloaded!", "success");
    } catch (err) {
      console.error(err);
      showToast("PDF generation failed", "error");
    } finally {
      if (stepInterval) clearInterval(stepInterval);
      setPdfLoading(false);
    }
  };

  if (loading) return <LoadingOverlay text="Loading paper..." />;
  if (!paper) return <div className="home-container"><p>Paper not found.</p></div>;

  const sections: ExamSection[] = paper.sections || [];
  // Pre-normalize fields to avoid the "Objects are not valid as a React
  // child" runtime error when the backend returns an object instead of
  // a string for eligibility / ageLimit.
  const eligibilityText = formatEligibility(paper.eligibility);
  const ageLimitText = formatAgeLimit(
    paper.age_limit as string | { min?: number; max?: number; relaxation?: string } | undefined | null
  );

  return (
    <div className="home-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, margin: "20px 0" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>{paper.exam_name}</h1>
          {paper.exam_board && <p style={{ color: "var(--text-muted)" }}>{paper.exam_board}</p>}
        </div>
        <button className="btn btn-primary" onClick={handleDownload} disabled={pdfLoading}>📥 Download PDF</button>
      </div>
      <div id="paper-content">
        <div className="exam-card" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
          <div className="exam-card-header">
            <div className="exam-card-title">{paper.exam_name}</div>
            {paper.exam_board && <div className="exam-card-cell"><div className="label">Organization</div><div className="value">{paper.exam_board}</div></div>}
          </div>
          {(paper.vacancy || paper.exam_date || eligibilityText || ageLimitText || paper.application_end_date) && (
            <div className="exam-card-row">
              {paper.vacancy && <div className="exam-card-cell"><div className="label">Total Posts</div><div className="value">{safeText(paper.vacancy)}</div></div>}
              {paper.exam_date && <div className="exam-card-cell"><div className="label">Exam Date</div><div className="value">{safeText(paper.exam_date)}</div></div>}
              {eligibilityText && <div className="exam-card-cell"><div className="label">Eligibility</div><div className="value">{eligibilityText}</div></div>}
              {ageLimitText && <div className="exam-card-cell"><div className="label">Age Limit</div><div className="value">{ageLimitText}</div></div>}
              {paper.application_end_date && <div className="exam-card-cell"><div className="label">Apply By</div><div className="value">{safeText(paper.application_end_date)}</div></div>}
            </div>
          )}
        </div>
        {sections.length > 0 ? (
          <>
            <div className="exam-questions-tabs">
              {sections.map((s, i) => (
                <div key={i} className={`exam-questions-tab ${i === activeSection ? "active" : ""}`} onClick={() => setActiveSection(i)}>
                  {s.title} ({s.questions.length})
                </div>
              ))}
            </div>
            <div className="exam-section">
              <div className="exam-section-title">{sections[activeSection]?.title}</div>
              {sections[activeSection]?.description && <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>{sections[activeSection].description}</p>}
              {sections[activeSection]?.questions.map((q, i) => (
                <div className="exam-q-item" key={i}>
                  <div className="exam-q-text">Q{i + 1}. {q.q}</div>
                  {q.options.map((opt, j) => <div key={j} className="exam-q-option">{String.fromCharCode(65 + j)}. {opt}</div>)}
                  {q.answer !== undefined && <div className="exam-q-option" style={{ color: "var(--success)", fontWeight: 600 }}>✓ Answer: {String.fromCharCode(65 + q.answer)}</div>}
                  {q.explanation && <div className="exam-q-option" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>💡 {q.explanation}</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="exam-section">
            <p>No questions available for this paper yet.</p>
          </div>
        )}
      </div>
      {pdfLoading && (
        <div className="pdf-loader-overlay">
          <div className="pdf-loader-spinner" />
          <div className="pdf-loader-step">{PDF_STEPS[pdfStep]}</div>
        </div>
      )}
    </div>
  );
}
