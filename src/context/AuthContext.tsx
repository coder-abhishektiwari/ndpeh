"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDB, isFirebaseConfigured } from "@/lib/firebase";
import { useToast } from "./ToastContext";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, exam: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  const saveUserToFirestore = useCallback(async (u: User, extra: { displayName?: string; examPreparingFor?: string } = {}) => {
    const db = getFirebaseDB();
    if (!db) return;
    try {
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: u.uid, email: u.email,
          displayName: u.displayName || extra.displayName || "Aspirant",
          photoURL: u.photoURL || null,
          examPreparingFor: extra.examPreparingFor || "Other",
          createdAt: serverTimestamp(), lastActive: serverTimestamp(),
          settings: { dailyEmailReminder: true, emailNotifications: true, preferredTopics: [] },
        });
      } else {
        await updateDoc(ref, { lastActive: serverTimestamp() });
      }
    } catch (err) {
      console.error("Firestore save error:", err);
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) await saveUserToFirestore(u);
    });
    return () => unsub();
  }, [saveUserToFirestore]);

  const handleAuthError = (err: any): string => {
    const code = err?.code || "";
    if (code.includes("invalid-credential") || code.includes("user-not-found") || code.includes("wrong-password")) return "Invalid email or password.";
    if (code.includes("email-already-in-use")) return "This email is already registered.";
    if (code.includes("weak-password")) return "Password should be at least 6 characters.";
    if (code.includes("popup-closed-by-user")) return "Sign-in cancelled.";
    if (code.includes("network-request-failed")) return "Network error. Please check your connection.";
    return err?.message || "Authentication error";
  };

  const signInWithEmailFn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) { showToast("Firebase not configured. Check .env.local", "error"); return; }
    try {
      const r = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(r.user);
      setModalOpen(false);
      showToast("Logged in successfully!", "success");
    } catch (err) { showToast(handleAuthError(err), "error"); throw err; }
  };

  const signUpWithEmailFn = async (email: string, password: string, name: string, exam: string) => {
    const auth = getFirebaseAuth();
    if (!auth) { showToast("Firebase not configured. Check .env.local", "error"); return; }
    try {
      const r = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(r.user, { displayName: name });
      await saveUserToFirestore(r.user, { examPreparingFor: exam });
      setModalOpen(false);
      showToast("Account created successfully!", "success");
    } catch (err) { showToast(handleAuthError(err), "error"); throw err; }
  };

  const signInWithGoogleFn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) { showToast("Firebase not configured. Check .env.local", "error"); return; }
    try {
      const provider = new GoogleAuthProvider();
      const r = await signInWithPopup(auth, provider);
      await saveUserToFirestore(r.user);
      setModalOpen(false);
      showToast(`Welcome, ${r.user.displayName || "Aspirant"}!`, "success");
    } catch (err) { showToast(handleAuthError(err), "error"); throw err; }
  };

  const signOutFn = async () => {
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
    showToast("Signed out successfully", "success");
  };

  const requireAuth = () => {
    if (loading) return false;
    if (!user) { setModalOpen(true); showToast("Please login to continue", "warning"); return false; }
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, modalOpen,
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
      signInWithEmail: signInWithEmailFn,
      signUpWithEmail: signUpWithEmailFn,
      signInWithGoogle: signInWithGoogleFn,
      signOut: signOutFn,
      requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const firebaseReady = isFirebaseConfigured();
