import type { Metadata } from "next";
import { Bricolage_Grotesque, Nunito_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "The Idea Jar",
  description: "Our family craft ideas, tagged and browsable.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            🫙 The Idea Jar
          </Link>
          <span className="tagline">craft ideas, tagged and ready</span>
        </header>
        {children}
        <footer className="site-footer">
          Private family craft library · images belong to their original
          creators
        </footer>
      </body>
    </html>
  );
}
