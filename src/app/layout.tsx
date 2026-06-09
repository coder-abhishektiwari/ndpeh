import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { AccessibilityRibbon } from "@/components/layout/AccessibilityRibbon";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { QuickNav } from "@/components/layout/QuickNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AuthModal } from "@/components/auth/AuthModal";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoDevanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari" });

export const metadata: Metadata = {
  title: "National Digital Exam Preparation & Resource Portal",
  description: "Free govt exam preparation platform with mock tests, quizzes, study material for SSC, RRB, Banking, UPSC, and State exams.",
  verification: { google: "pZZtTIRFc3pubpMsTCbVxA81XIfSEXJ-8CbiRSeTWMc" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');` }} />
          </>
        )}
      </head>
      <body className={`${inter.variable} ${notoDevanagari.variable}`} suppressHydrationWarning>
        <Providers>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <TopBar />
                <AccessibilityRibbon />
                <SiteHeader />
                <QuickNav />
                <main>{children}</main>
                <SiteFooter />
                <AuthModal />
                <ToastContainer />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
