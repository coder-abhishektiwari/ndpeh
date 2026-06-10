"use client";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDB } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { examApi } from "@/lib/api";
import type { ExamCalendarItem } from "@/types";
import { formatEligibility } from "@/lib/format";

// FIXED: Custom inline CSS Card Skeleton component for content loading
function CardSkeleton() {
  return (
    <div className="skeleton-card" style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      padding: "20px",
      background: "var(--surface, #fff)",
      border: "1px solid var(--border, #eee)",
      borderRadius: "8px",
      marginBottom: "12px",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="skeleton-shimmer" style={{ width: "40%", height: "20px", background: "#e2e8f0", borderRadius: "4px" }} />
        <div className="skeleton-shimmer" style={{ width: "25%", height: "14px", background: "#e2e8f0", borderRadius: "4px" }} />
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <div className="skeleton-shimmer" style={{ width: "80px", height: "12px", background: "#e2e8f0", borderRadius: "4px" }} />
          <div className="skeleton-shimmer" style={{ width: "140px", height: "12px", background: "#e2e8f0", borderRadius: "4px" }} />
          <div className="skeleton-shimmer" style={{ width: "60px", height: "12px", background: "#e2e8f0", borderRadius: "4px" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "140px" }}>
        <div className="skeleton-shimmer" style={{ width: "100%", height: "36px", background: "#e2e8f0", borderRadius: "6px" }} />
        <div className="skeleton-shimmer" style={{ width: "100%", height: "36px", background: "#e2e8f0", borderRadius: "6px" }} />
      </div>
    </div>
  );
}

// FIXED: Sector Pill Skeleton buttons to maintain design continuity during API call
function SectorSkeleton() {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
      <div className="skeleton-shimmer" style={{ width: "90px", height: "36px", background: "#e2e8f0", borderRadius: "20px" }} />
      <div className="skeleton-shimmer" style={{ width: "110px", height: "36px", background: "#e2e8f0", borderRadius: "20px" }} />
      <div className="skeleton-shimmer" style={{ width: "100px", height: "36px", background: "#e2e8f0", borderRadius: "20px" }} />
      <div className="skeleton-shimmer" style={{ width: "130px", height: "36px", background: "#e2e8f0", borderRadius: "20px" }} />
    </div>
  );
}

export default function ExamCalendarPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ExamCalendarItem[]>([]);

  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [timelineFilter, setTimelineFilter] = useState<string>("all"); 

  useEffect(() => {
    (async () => {
      try {
        const exams = await examApi.getExams();
        const sectorsList = await examApi.getSectors();
        
        if (exams.length) setItems(exams);
        if (sectorsList && sectorsList.sectors) {
          setSectors(sectorsList.sectors);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally { 
        setLoading(false);
      }
      
      if (user) {
        const db = getFirebaseDB();
        if (db) {
          try {
            const snap = await getDoc(doc(db, "savedExams", user.uid));
            if (snap.exists()) setSavedIds(new Set((snap.data().examIds as string[]) || []));
          } catch {}
        }
      }
    })();
  }, [user]);

  const getCalculatedStatus = (item: ExamCalendarItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = item.application_start_date ? new Date(item.application_start_date) : null;
    const end = item.application_end_date ? new Date(item.application_end_date) : null;
    const examDate = item.exam_date ? new Date(item.exam_date) : null;

    if (examDate && examDate < today) {
      return { text: "Exam Conducted", className: "exam-conducted", canApply: false };
    }
    if (end && today > end) {
      return { text: "Application Closed", className: "app-closed", canApply: false };
    }
    if (start && today >= start && end && today <= end) {
      return { text: "Apply Now", className: "apply-now", canApply: true };
    }
    return { text: "Upcoming", className: "upcoming", canApply: false };
  };

  const filtered = useMemo(() => items.filter(i => {
    if (selectedSector !== "all" && i.sector?.toLowerCase() !== selectedSector.toLowerCase()) return false;
    if (search && !(`${i.exam_name} ${i.exam_board}`.toLowerCase().includes(search.toLowerCase()))) return false;
    
    if (timelineFilter !== "all") {
      const liveState = getCalculatedStatus(i);
      if (timelineFilter === "apply_now" && !liveState.canApply) return false;
      if (timelineFilter === "upcoming" && liveState.text !== "Upcoming") return false;
      if (timelineFilter === "app_closed" && liveState.text !== "Application Closed") return false;
      if (timelineFilter === "exam_conducted" && liveState.text !== "Exam Conducted") return false;
    }
    
    return true;
  }), [items, selectedSector, search, timelineFilter]);

  const grouped = useMemo(() => {
    const m: Record<string, ExamCalendarItem[]> = {};
    filtered.forEach(i => { const d = i.exam_date || "TBA"; (m[d] ||= []).push(i); });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggleSave = async (item: ExamCalendarItem) => {
    if (!user) { showToast("Please login to save exams", "warning"); return; }
    const db = getFirebaseDB(); if (!db) return;
    const next = new Set(savedIds);
    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
    setSavedIds(next);
    try { 
      await setDoc(doc(db, "savedExams", user.uid), { examIds: Array.from(next), updatedAt: serverTimestamp() }); 
      showToast(next.has(item.id) ? "Saved" : "Removed", "success"); 
    } catch { 
      showToast("Failed to update", "error"); 
    }
  };

  return (
    <div className="home-container">
      {/* Dynamic Inline CSS Injection with Shimmer Effect Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        .search-filter-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          width: 100%;
        }
        .main-search-bar {
          flex: 1;
          padding: 11px 14px;
          border-radius: 6px;
          border: 1px solid var(--border, #ccc);
          background: var(--surface, #fff);
          color: var(--text-main, #000);
          font-size: 14px;
        }
        .compact-dropdown {
          padding: 11px 12px;
          border-radius: 6px;
          background: var(--surface, #f9f9f9);
          border: 1px solid var(--border, #ccc);
          color: var(--text-main, #333);
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          width: 190px;
          white-space: nowrap;
        }
        .exam-card-tag.app-closed {
          background: #FEF3C7 !important;
          color: #D97706 !important;
          border: 1px solid #FCD34D;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .exam-card-tag.exam-conducted {
          background: #F3F4F6 !important;
          color: #4B5563 !important;
          border: 1px solid #E5E7EB;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .exam-card-tag.apply-now {
          background: #DCFCE7 !important;
          color: #15803D !important;
          border: 1px solid #BBF7D0;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .exam-card-tag.upcoming {
          background: #DBEAFE !important;
          color: #1D4ED8 !important;
          border: 1px solid #BFDBFE;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .skeleton-shimmer {
          animation: shimmerTransform 1.6s infinite linear;
          background: linear-gradient(to right, #eff6ff 4%, #e2e8f0 25%, #eff6ff 36%) !important;
          background-size: 1000px 100% !important;
        }
        @keyframes shimmerTransform {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}} />

      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "20px 0" }}>📅 Exam Calendar</h1>
      
      {/* Top Controls always visible */}
      <div className="search-filter-row">
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search exams, boards or key details..." 
          className="main-search-bar"
          disabled={loading} 
          aria-label="Search" 
        />
        
        <select
          value={timelineFilter}
          onChange={(e) => setTimelineFilter(e.target.value)}
          className="compact-dropdown"
          disabled={loading}
        >
          <option value="all">🌐 All Windows</option>
          <option value="apply_now">🚀 Active (Apply Now)</option>
          <option value="upcoming">⏳ Upcoming Openings</option>
          <option value="app_closed">⚠️ Application Closed</option>
          <option value="exam_conducted">🛑 Exam Conducted</option>
        </select>
      </div>

      {/* FIXED: Sectors Filter Row with individual conditional skeleton loader state */}
      <div className="calendar-filters" style={{ marginTop: 0, marginBottom: "20px", minHeight: "38px", display: "flex", alignItems: "center" }}>
        {loading ? (
          <SectorSkeleton />
        ) : (
          <div className="calendar-type-filters">
            <button
              className={`calendar-type-btn ${selectedSector === "all" ? "active" : ""}`}
              onClick={() => setSelectedSector("all")}
            >
              All Sectors
            </button>
            {Array.isArray(sectors) && sectors.map(s => (
              <button
                key={s}
                className={`calendar-type-btn ${selectedSector === s ? "active" : ""}`}
                onClick={() => setSelectedSector(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Content Area Skeleton/Render Block */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : grouped.length === 0 ? (
        <p style={{ color: "var(--text-muted)", marginTop: "20px" }}>No exams match your configured filter parameters.</p>
      ) : (
        grouped.map(([date, list]) => {
          let displayDate = date;
          if (date !== "TBA") {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              displayDate = parsedDate.toLocaleDateString("en-IN", { 
                weekday: "long", year: "numeric", month: "long", day: "numeric" 
              });
            }
          } else {
            displayDate = "To Be Announced (TBA)";
          }

          return (
            <div className="calendar-date-group" key={date}>
              <div className="calendar-date-header">{displayDate}</div>
              {list.map(item => {
                const currentStatus = getCalculatedStatus(item);
                
                return (
                  <div className="calendar-exam-card" key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                    <div className="calendar-exam-info" style={{ flex: 1 }}>
                      <div className="calendar-exam-name" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {item.exam_name} 
                        <span className={`exam-card-tag ${currentStatus.className}`}>
                          {currentStatus.text}
                        </span>
                      </div>
                      <div className="calendar-exam-org">{item.exam_board}</div>
                      <div className="calendar-exam-dates">
                        <span>📅 Exam Date: {item.exam_date || "TBA"}</span>
                        <span>📝 Apply Window: {item.application_start_date || "N/A"} → {item.application_end_date || "N/A"}</span>
                        {item.vacancy && <span>👥 Posts: {item.vacancy}</span>}
                        <span>🏢 Sector: {item.sector}</span>
                      </div>
                    </div>
                    
                    <div className="calendar-exam-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "140px" }}>
                      {currentStatus.canApply ? (
                        <a 
                          href={item.apply_link ? String(item.apply_link) : "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ textAlign: "center", textDecoration: "none", width: "100%", background: "var(--clr-success, #16A34A)", borderColor: "var(--clr-success, #16A34A)", fontWeight: 600 }}
                        >
                          🚀 Apply Now
                        </a>
                      ) : (
                        <button 
                          className="btn btn-secondary" 
                          disabled 
                          style={{ width: "100%", opacity: 0.55, cursor: "not-allowed", fontSize: "13px", fontWeight: 500 }}
                          title={currentStatus.text === "Upcoming" ? "Registration has not started yet" : "Registration period has expired"}
                        >
                          🔒 Links Locked
                        </button>
                      )}
                      
                      <button 
                        className={`btn ${savedIds.has(item.id) ? "btn-success" : "btn-secondary"}`} 
                        onClick={() => toggleSave(item)}
                        style={{ width: "100%" }}
                      >
                        {savedIds.has(item.id) ? "✓ Saved" : "🔖 Save"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}