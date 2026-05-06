import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeVote — Decentralized Voting",
  description: "A transparent, tamper-proof voting system powered by Ethereum.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
