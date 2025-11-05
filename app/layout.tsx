import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import ConditionalNavbar from './components/ConditionalNavbar';
import MainContent from './components/MainContent';
import { Suspense } from "react";
import Providers from './components/Providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calen เด้อ!",
  description: "Created by RC8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <Suspense fallback={null}>
            <ConditionalNavbar />
          </Suspense>
          <MainContent>
            {children}
          </MainContent>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}