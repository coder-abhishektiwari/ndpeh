# NDPEH Next.js — Migrated from Vanilla JS

A complete Next.js 14 (App Router) + TypeScript port of the National Digital Exam Preparation Hub, with a modern **neumorphism design theme** (soft, raised surfaces using dual shadows).

## ✨ What's included

- **All 7 pages migrated** with identical functionality
- **Neumorphism UI theme** (light + dark) — see `src/app/globals.css` for the `--neu-shadow` tokens
- **Firebase Auth** (email + Google) via modular SDK
- **Firestore** for user profiles, quiz results, mock results, saved exams
- **REST API client** preserved (`examApi`) pointing to `https://array-to-pdf-converter.onrender.com`
- **PDF generation** — server-side first (POST to `/generate-pdf`), with `html2pdf.js` client-side fallback
- **Old URL redirects** — `/pages/all-exams.html` etc. now redirect to clean Next.js routes
- **Google Analytics** via `NEXT_PUBLIC_GA_ID` (default: `G-WX8E8PJDF4`)

## 🚀 Setup

1. `cd ndpeh-next`
2. Copy `.env.example` → `.env.local` and fill in your Firebase keys
3. `npm install`
4. `npm run dev`

Visit `http://localhost:3000`.

## 📁 Project structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # RootLayout: TopBar, Header, QuickNav, Footer
│   ├── page.tsx              # /
│   ├── all-exams/page.tsx    # /all-exams
│   ├── exam-calendar/        # /exam-calendar
│   ├── quiz/                 # /quiz
│   ├── mock-test/            # /mock-test
│   ├── dashboard/            # /dashboard
│   └── exam/[paperId]/       # /exam/:paperId (dynamic)
├── components/               # All UI components
├── context/                  # AuthContext, ThemeContext, ToastContext
├── lib/                      # firebase.ts, api.ts
├── data/sampleData.ts        # Quiz topics, mock tests, calendar
├── types/                    # TypeScript types + module shims
└── styles/                   # (merged into globals.css)
```

## 🔗 Link/API parity

| Old URL | New URL | Status |
|---|---|---|
| `/` | `/` | ✅ |
| `/pages/all-exams.html` | `/all-exams` | ✅ (redirect) |
| `/pages/exam-calendar.html` | `/exam-calendar` | ✅ (redirect) |
| `/pages/quiz.html` | `/quiz` | ✅ (redirect) |
| `/pages/mock-test.html` | `/mock-test` | ✅ (redirect) |
| `/pages/dashboard.html` | `/dashboard` | ✅ (redirect) |
| `/pages/exam-questions-page.html?paper=...` | `/exam/:paperId` | ✅ (dynamic) |
| `window.examApi.*` | `import { examApi }` | ✅ |
| Firebase compat SDK | Firebase modular SDK | ✅ |

## 🎨 Neumorphism theme

The theme is built around 3 shadow tokens:
- `--neu-shadow` — raised surface (default cards)
- `--neu-shadow-sm` — small raised (buttons, badges)
- `--neu-shadow-inset` — pressed/inset (inputs, active states)

Dark mode auto-applies via `[data-theme="dark"]` on `<html>`.

## 🔐 Security note

The original `js/env.js` contained live Firebase API keys committed to your zip. **Rotate these keys** in the Firebase Console before deploying publicly. The new `.env.local` pattern keeps them gitignored.

## 📜 Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — run Next.js linter
