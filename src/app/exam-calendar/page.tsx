"use client";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDB } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { examApi } from "@/lib/api";
import type { ExamCalendarItem } from "@/types";
import { LoadingOverlay } from "@/components/ui/Skeletons";
import { formatEligibility } from "@/lib/format";

export default function ExamCalendarPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ExamCalendarItem[]>([]);

  // Sector filters ke liye states
  const [sectors, setSectors] = useState<string[]>([]); // Dynamic sectors list from API
  const [selectedSector, setSelectedSector] = useState<string>("all"); // Active filter state

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
  (async () => {
    try {
      const exams = await examApi.getExams();
      const sectorsList = await examApi.getSectors(); // Yeh { sectors: [] } return karega
      
      if (exams.length) setItems(exams);
      
      // FIX HERE: sectorsList ke andar se sectors array ko nikal kar set karna hai
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

  // FIX: Type ki jagah i.sector par filtering lagayi hai
  const filtered = useMemo(() => items.filter(i => {
    if (selectedSector !== "all" && i.sector?.toLowerCase() !== selectedSector.toLowerCase()) return false;
    if (search && !(`${i.exam_name} ${i.exam_board}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [items, selectedSector, search]);

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
    try { await setDoc(doc(db, "savedExams", user.uid), { examIds: Array.from(next), updatedAt: serverTimestamp() }); showToast(next.has(item.id) ? "Saved" : "Removed", "success"); }
    catch { showToast("Failed to update", "error"); }
  };

  if (loading) return <LoadingOverlay text="Loading exam calendar..." />;

  return (
    <div className="home-container">
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "20px 0" }}>📅 Exam Calendar</h1>
      <div className="calendar-filters">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams or exam_board..." aria-label="Search" />

        {/* FIX: Sector buttons rendering aur filtering active state */}
        <div className="calendar-type-filters">
          <button
            className={`calendar-type-btn ${selectedSector === "all" ? "active" : ""}`}
            onClick={() => setSelectedSector("all")}
          >
            All
          </button>

          {/* FIX HERE: Array check karne ke baad hi map lagayein */}
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
      </div>

      {grouped.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No exams match your filters.</p> : grouped.map(([date, list]) => (
        <div className="calendar-date-group" key={date}>
          <div className="calendar-date-header">{new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          {list.map(item => (
            <div className="calendar-exam-card" key={item.id}>
              <div className="calendar-exam-info">
                {/* FIX: item.examName ko item.exam_name kiya (pichle code mein dono mix the) */}
                <div className="calendar-exam-name">{item.exam_name} <span className={`exam-card-tag ${item.status}`} style={{ marginLeft: 8 }}>{item.status}</span></div>
                <div className="calendar-exam-org">{item.exam_board}</div>
                <div className="calendar-exam-dates">
                  <span>📅 Exam: {item.exam_date}</span>
                  <span>📝 Apply Between: {item.application_start_date} → {item.application_end_date}</span>
                  {item.vacancy && <span>👥 Posts: {item.vacancy}</span>}
                  <span>🏢 Sector: {item.sector}</span>
                </div>
              </div>
              <div className="calendar-exam-actions">
                <button className={`btn ${savedIds.has(item.id) ? "btn-success" : "btn-secondary"}`} onClick={() => toggleSave(item)}>{savedIds.has(item.id) ? "✓ Saved" : "🔖 Save"}</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}