"use client";
import Link from "next/link";
import type { Paper } from "@/types";
import { formatEligibility, formatAgeLimit, safeText } from "@/lib/format";

export function ExamCard({ paper, isCompact = false }: { paper: Paper; isCompact?: boolean }) {
  const eligibilityText = formatEligibility(paper.eligibility);
  const ageLimitText = formatAgeLimit(paper.ageLimit);

  return (
    <div className={`exam-card ${isCompact ? "compact-mode" : ""}`}>
      
      {/* 1. HEADER (Title hamesha dikhega) */}
      <div className="exam-card-header">
        <div className="exam-card-title">{paper.exam_name}</div>
        {paper.status && <span className={`exam-card-tag ${paper.status}`}>{paper.status}</span>}
      </div>

      {/* 2. COMPACT MODE (Home Page) */}
      {isCompact ? (
        <div className="exam-card-row">
          {/* Ab yahan hum eligibility ko bhi safe-side render kar rahe hain taaki home par dikhe */}
          {eligibilityText && <div className="exam-card-cell"><b>Eligibility:</b> {eligibilityText}</div>}
          {paper.exam_board && <span className="compact-meta"><b>Org:</b> {paper.exam_board}</span>}
          {paper.vacancy && <span className="compact-meta"><b>Posts:</b> {safeText(paper.vacancy)}</span>}
          {paper.application_end_date && <span className="compact-meta"><b>Apply:</b> {paper.application_end_date}</span>}
          {paper.exam_mode && <span className="compact-meta"><b>Mode:</b> {safeText(paper.exam_mode)}</span>}
        </div>
      ) : (
        /* 3. NORMAL MODE (Baki saare pages ke liye) */
        <>
          {(paper.exam_board || paper.vacancy || paper.application_end_date || paper.exam_date || paper.exam_mode || paper.exam_duration) && (
            <div className="exam-card-row">
              {paper.exam_board && <div className="exam-card-cell"><div className="label">Exam Board:</div><div className="value">{paper.exam_board}</div></div>}
              {paper.vacancy && <div className="exam-card-cell"><div className="label">Total Posts:</div><div className="value">{safeText(paper.vacancy)}</div></div>}
              {paper.application_start_date && <div className="exam-card-cell"><div className="label">Application Open Date:</div><div className="value">{paper.application_start_date}</div></div>}
              {paper.application_end_date && <div className="exam-card-cell"><div className="label">Last Date to Apply:</div><div className="value">{paper.application_end_date}</div></div>}
              {paper.exam_date && <div className="exam-card-cell"><div className="label">Exam Date: </div><div className="value">{paper.exam_date}</div></div>}
              {paper.exam_mode && <div className="exam-card-cell"><div className="label">Exam Mode</div><div className="value">{safeText(paper.exam_mode)}</div></div>}
              {paper.exam_duration && <div className="exam-card-cell"><div className="label">Duration</div><div className="value">{safeText(paper.exam_duration)}</div></div>}
            
            </div>
          )}
          {(eligibilityText || ageLimitText ) && (
            <div className="exam-card-row">
              {eligibilityText && <div className="exam-card-cell"><div className="label">Eligibility</div><div className="value">{eligibilityText}</div></div>}
              {ageLimitText && <div className="exam-card-cell"><div className="label">Age Limit</div><div className="value">{ageLimitText}</div></div>}
            </div>
          )}
        </>
      )}

      {/* Buttons hidden in compact mode */}
      {!isCompact && (
        <div className="exam-card-actions">
          <Link href={`/exam/${encodeURIComponent(paper.id)}`} className="btn btn-primary">Practice Questions</Link>
          {paper.notification_url && <a href={paper.notification_url} target="_blank" rel="noreferrer" className="btn btn-secondary">Official Notification</a>}
          {paper.apply_url && <a href={paper.apply_url} target="_blank" rel="noreferrer" className="btn btn-secondary">Apply Online</a>}
        </div>
      )}

      {/* Entire Card Click overlay for home dashboard */}
      {isCompact && (
        <Link href={`/exam/${encodeURIComponent(paper.id)}`} className="compact-card-overlay-link" title="Click to view details">
          <span className="sr-only">View {paper.exam_name}</span>
        </Link>
      )}
    </div>
  );
}