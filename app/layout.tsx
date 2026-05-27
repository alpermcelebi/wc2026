import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 - Bracket Predictor",
  description: "Predict the full 48-team World Cup 2026 group stages, knockout brackets, and individual awards! Save your predictions and track your global leaderboard rank live.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased max-w-full overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-[#06060c] max-w-full overflow-x-hidden">{children}</body>
    </html>
  );
}
