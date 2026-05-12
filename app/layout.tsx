import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumina — YouTube Intelligence",
  description: "Instant summaries, smart chat, semantic search. One URL away.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(13, 17, 32, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              backdropFilter: "blur(20px)",
            },
          }}
        />
      </body>
    </html>
  );
}
