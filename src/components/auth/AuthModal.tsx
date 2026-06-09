"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function AuthModal() {
  const { modalOpen, closeModal, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "", exam: "SSC CGL" });

  // Reset the visible error whenever the modal opens or the user
  // switches between login / signup tabs.
  useEffect(() => {
    if (modalOpen) { setError(""); }
  }, [modalOpen, tab]);

  if (!modalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await signInWithEmail(form.email, form.password); }
    catch (err: unknown) { setError((err as Error).message || "Login failed"); }
    finally { setBusy(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await signUpWithEmail(form.email, form.password, form.name, form.exam); }
    catch (err: unknown) { setError((err as Error).message || "Signup failed"); }
    finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setBusy(true); setError("");
    try { await signInWithGoogle(); }
    catch (err: unknown) { setError((err as Error).message || "Google sign-in failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="auth-modal">
        <button className="auth-close-btn" onClick={closeModal} aria-label="Close">&times;</button>
        <div className="auth-modal-logo">
          <div className="seal">DEH</div>
          <h2>Aspirant Portal Login</h2>
          <p>Access your personalized preparation hub</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Login</button>
          <button className={`auth-tab-btn ${tab === "signup" ? "active" : ""}`} onClick={() => setTab("signup")}>Register</button>
        </div>
        {error && <div className="auth-error-msg show">{error}</div>}
        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <input type="email" className="auth-input" required placeholder="Enter your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <input type="password" className="auth-input" required placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" className="auth-btn-primary" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
            <div className="auth-divider">OR</div>
            <button type="button" className="auth-btn-google" onClick={handleGoogle} disabled={busy}>
              <svg className="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="auth-form-group">
              <label className="auth-label">Full Name</label>
              <input type="text" className="auth-input" required placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <input type="email" className="auth-input" required placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <input type="password" className="auth-input" required minLength={6} placeholder="Create a password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Primary Exam Focus</label>
              <select className="auth-input" value={form.exam} onChange={(e) => setForm({ ...form, exam: e.target.value })}>
                <option value="SSC CGL">SSC CGL</option>
                <option value="SSC GD">SSC GD</option>
                <option value="RRB NTPC">RRB NTPC</option>
                <option value="RRB Group D">RRB Group D</option>
                <option value="UP Police">UP Police</option>
                <option value="Bihar Police">Bihar Police</option>
                <option value="UPSSSC PET">UPSSSC PET</option>
                <option value="Other">Other Exams</option>
              </select>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={busy}>{busy ? "Creating account..." : "Create Account"}</button>
            <div className="auth-divider">OR</div>
            <button type="button" className="auth-btn-google" onClick={handleGoogle} disabled={busy}>
              <svg className="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign up with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
