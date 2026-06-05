import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { Navbar } from "@/app/components/navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap"
});

import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "EnvArmor | Secret Leak Prevention",
  description: "Stop .env leaks before they happen. Scan, block, and track savings with EnvArmor.",
  icons: {
    icon: "/EnvGuard.png",
    apple: "/EnvGuard.png",
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-neo-bg text-neo-ink font-sans antialiased">
        <Toaster position="bottom-right" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
