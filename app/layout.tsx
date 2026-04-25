import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Business - AI Financial Advisor",
  description: "AI-powered personal finance management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}