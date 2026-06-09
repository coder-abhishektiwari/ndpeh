// src/types/modules.d.ts
declare module "html2pdf.js" {
  const html2pdf: () => { set: (o: Record<string, unknown>) => { from: (el: HTMLElement) => { save: () => Promise<void> } }; from: (el: HTMLElement) => { save: () => Promise<void> } };
  export default html2pdf;
}
declare module "next/link" {
  import * as React from "react";
  const Link: React.ComponentType<{ href: string; children?: React.ReactNode; className?: string; [k: string]: unknown }>;
  export default Link;
}
declare module "next/navigation" {
  export function usePathname(): string;
  export function useRouter(): { push: (url: string) => void; replace: (url: string) => void; back: () => void; refresh: () => void };
  export function useParams<T = Record<string, string>>(): T;
  export function useSearchParams(): URLSearchParams;
}
declare module "next/font/google" {
  export function Inter(opts: { subsets: string[]; variable?: string }): { variable: string; className: string };
  export function Noto_Sans_Devanagari(opts: { subsets: string[]; variable?: string }): { variable: string; className: string };
}
declare module "firebase/auth" {
  export interface User { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }
  export function getAuth(app?: unknown): unknown;
  export function onAuthStateChanged(auth: unknown, cb: (user: User | null) => void): () => void;
  export function signInWithEmailAndPassword(auth: unknown, email: string, password: string): Promise<{ user: User }>;
  export function createUserWithEmailAndPassword(auth: unknown, email: string, password: string): Promise<{ user: User }>;
  export function signInWithPopup(auth: unknown, provider: unknown): Promise<{ user: User }>;
  export const GoogleAuthProvider: new () => unknown;
  export function signOut(auth: unknown): Promise<void>;
  export function updateProfile(user: User, data: { displayName?: string; photoURL?: string }): Promise<void>;
  export function setPersistence(auth: unknown, p: unknown): Promise<void>;
  export const browserLocalPersistence: unknown;
  export type Auth = unknown;
}
declare module "firebase/firestore" {
  export function getFirestore(app?: unknown): unknown;
  export function initializeFirestore(app: unknown, opts: unknown): unknown;
  export const persistentLocalCache: (opts: unknown) => unknown;
  export const persistentMultipleTabManager: () => unknown;
  export function doc(db: unknown, ...path: string[]): unknown;
  export function getDoc(ref: unknown): Promise<{ exists: () => boolean; data: () => any; id: string }>;
  export function setDoc(ref: unknown, data: unknown): Promise<void>;
  export function updateDoc(ref: unknown, data: unknown): Promise<void>;
  export function collection(db: unknown, ...path: string[]): unknown;
  export function addDoc(coll: unknown, data: unknown): Promise<unknown>;
  export function getDocs(q: unknown): Promise<{ docs: { id: string; data: () => any }[] }>;
  export function query(coll: unknown, ...filters: unknown[]): unknown;
  export function where(field: string, op: string, value: unknown): unknown;
  export function orderBy(field: string, direction?: "asc" | "desc"): unknown;
  export function serverTimestamp(): unknown;
  export type Firestore = unknown;
}
declare module "firebase/app" {
  export function initializeApp(config: Record<string, string | undefined>): unknown;
  export function getApps(): unknown[];
  export function getApp(): unknown;
  export type FirebaseApp = unknown;
}
