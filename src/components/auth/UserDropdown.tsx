"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (!user) return null;
  const initial = (user.displayName || user.email || "A").charAt(0).toUpperCase();
  const name = user.displayName || user.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="user-dropdown" ref={ref}>
      <div className="user-avatar-btn" onClick={() => setOpen(!open)}>
        <div className="user-avatar-placeholder" style={{ width: 24, height: 24, fontSize: 10 }}>{initial}</div>
        <span>{name}</span>
        <span style={{ fontSize: 10 }}>▼</span>
      </div>
      {open && (
        <div className="user-dropdown-menu open">
          <div className="user-dropdown-header">
            <div className="user-dropdown-name">{name}</div>
            <div className="user-dropdown-email">{user.email}</div>
          </div>
          <Link href="/dashboard" className="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            Dashboard
          </Link>
          <Link href="/dashboard#quiz" className="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            My Quizzes
          </Link>
          <Link href="/dashboard#mock" className="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Mock Tests
          </Link>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item danger" onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
