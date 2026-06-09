"use client";
import { useEffect, useMemo, useState } from "react";
import { examApi } from "@/lib/api";
import type { Paper } from "@/types";
import { ExamCard } from "@/components/ui/ExamCard";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import { SkeletonList } from "@/components/ui/Skeletons";

export default function AllExamsPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); const [sector, setSector] = useState("");

  useEffect(() => { (async () => { try { setPapers(await examApi.listPapers()); } finally { setLoading(false); } })(); }, []);
  const sectors = useMemo(() => Array.from(new Set(papers.map(p => p.sector).filter(Boolean) as string[])), [papers]);
  const filtered = useMemo(() => papers.filter(p => {
    if (sector && p.sector !== sector) return false;
    if (q) {
      const t = `${p.t} ${p.exam_board ?? ""} ${p.post_name ?? ""}`.toLowerCase();
      return t.includes(q.toLowerCase());
    }
    return true;
  }), [papers, q, sector]);

  return (
    <div className="home-container" id="main-directory">
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "20px 0" }}>All Exams</h1>
      <SearchFilterBar sectors={sectors} onSearch={(qq, ss) => { setQ(qq); setSector(ss); }} />
      {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No exams match your search.</p> : filtered.map(p => <ExamCard key={p.id} paper={p} />)}
    </div>
  );
}
