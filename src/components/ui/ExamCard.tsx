"use client";
import Link from "next/link";
import type { Paper } from "@/types";
import { formatEligibility, formatAgeLimit, safeText } from "@/lib/format";
import { getExamStatusLabel } from "@/lib/examStatus";

export function ExamCard({ paper, isCompact = false }: { paper: Paper; isCompact?: boolean }) {
  const eligibilityText = formatEligibility(paper.eligibility);
  const ageLimitText = formatAgeLimit(
    paper.ageLimit as string | { min?: number; max?: number; relaxation?: string } | undefined | null
  );
  // Component ke andar, existing lines ke saath:
  const dynamicStatus = getExamStatusLabel(paper);

  // Badge color helper
  function statusClass(label: string): string {
    if (label.includes("Exam Tomorrow") || label.includes("Closing Soon")) return "status-urgent";
    if (label.includes("Exam This Week") || label.includes("Approaching")) return "status-warning";
    if (label.includes("Application Open")) return "status-active";
    if (label.includes("Opening Soon") || label.includes("Admit Card")) return "status-info";
    if (label.includes("Results")) return "status-results";
    return "status-upcoming";
  }

  return (
    <div className={`exam-card ${isCompact ? "compact-mode" : ""}`}>

      {/* 1. HEADER (Title hamesha dikhega) */}
      <div className="exam-card-header">
        <div className="exam-card-title">{paper.exam_name}</div>
        {dynamicStatus && (
          <span className={`exam-card-tag ${statusClass(dynamicStatus)}`}>
            {dynamicStatus}
          </span>
        )}
      </div>

      {/* 2. COMPACT MODE (Home Page) */}
      {isCompact ? (
        <div className="exam-card-compact-body">

          {/* Row 1: Org + Sector + Status already in header */}
          <div className="compact-meta-row">
            {paper.exam_board && (
              <span className="compact-meta">
                <b>By:</b> {paper.exam_board}
              </span>
            )}
            {paper.sector && (
              <span className="compact-meta">
                <b>Sector:</b> {paper.sector}
              </span>
            )}
            {paper.post_name && (
              <span className="compact-meta">
                <b>Post:</b> {paper.post_name}
              </span>
            )}
          </div>

          {/* Row 2: Vacancy + Salary + Location */}
          <div className="compact-meta-row">
            {paper.vacancy && (
              <span className="compact-meta highlight">
                <b>Posts:</b> {safeText(paper.vacancy)}
              </span>
            )}
            {paper.salary && (
              <span className="compact-meta">
                <b>Salary:</b> {safeText(paper.salary)}
              </span>
            )}
            {paper.job_location && (
              <span className="compact-meta">
                <b>Location:</b> {paper.job_location}
              </span>
            )}
          </div>

          {/* Row 3: Eligibility */}
          {eligibilityText && (
            <div className="compact-meta-row">
              <span className="compact-meta">
                <b>Eligibility:</b> {eligibilityText}
              </span>
            </div>
          )}

          {/* Row 4: Dates — most critical */}
          <div className="compact-meta-row compact-dates">
            {paper.application_end_date && (
              <span className="compact-meta date-urgent">
                <b>Last Date:</b> {paper.application_end_date}
              </span>
            )}
            {paper.exam_date && (
              <span className="compact-meta">
                <b>Exam:</b> {paper.exam_date}
              </span>
            )}
            {paper.exam_mode && (
              <span className="compact-meta">
                <b>Mode:</b> {safeText(paper.exam_mode)}
              </span>
            )}
          </div>

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
          {(eligibilityText || ageLimitText) && (
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