"use client";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { UserDropdown } from "@/components/auth/UserDropdown";

export function AccessibilityRibbon() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, openModal } = useAuth();
  return (
    <div className="accessibility-ribbon">
      <div className="ribbon-links">
        <a href="#main-directory" title="Skip to main content">Skip to Main Content</a>
        <a href="#notice-bulletin" title="Screen reader access">Screen Reader Access</a>
      </div>
      <div className="controls-group">
        {loading ? (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</span>
        ) : user ? (
          <UserDropdown />
        ) : (
          <button className="header-auth-btn" onClick={openModal} aria-label="Open login">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Login / Register
          </button>
        )}
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
          <span>{theme === "light" ? "🌙" : "☀️"}</span>
          <span>{theme === "light" ? "Night Mode" : "Day Mode"}</span>
        </button>
        <label htmlFor="portalLangSelect" className="sr-only">Language</label>
        <select id="portalLangSelect" className="lang-select" defaultValue="en" aria-label="Language selection">
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>
      </div>
    </div>
  );
}
