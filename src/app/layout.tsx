import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/sw-register";
import { ThemeProvider } from "@/lib/theme";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import FeedbackWidget from "@/components/FeedbackWidget";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STEM Capstone Hub",
  description: "Capstone project management, documentation, collaboration, evaluation, and progress-tracking platform for STEM students.",
};

const themeInitScript = `(function(){try{var k='sch_theme';var t=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='dark'||(t==='system'&&m)||(!t&&m);if(r){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f766e" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full font-sans antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
        <ThemeProvider>
          <AnalyticsProvider>
            <SwRegister />
            {children}
            <FeedbackWidget />
            <InstallPrompt />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
