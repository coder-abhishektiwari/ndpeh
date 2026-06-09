"use client";
import { useState } from "react";
export function SearchFilterBar({ sectors, onSearch, placeholder = "Search by exam, exam_board, post..." }: { sectors: string[]; onSearch: (q: string, sector: string) => void; placeholder?: string; }) {
  const [q, setQ] = useState(""); const [s, setS] = useState("");
  return (
    <div className="search-filter-bar">
      <input value={q} onChange={(e) => { setQ(e.target.value); onSearch(e.target.value, s); }} placeholder={placeholder} aria-label="Search" />
      <select value={s} onChange={(e) => { setS(e.target.value); onSearch(q, e.target.value); }} aria-label="Filter by sector">
        <option value="">All Sectors</option>
        {sectors.map(sec => <option key={sec} value={sec}>{sec}</option>)}
      </select>
      <button className="btn btn-primary" onClick={() => onSearch(q, s)}>Search</button>
    </div>
  );
}
