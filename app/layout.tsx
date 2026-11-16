import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuoteRevive — Revive your dead quotes",
  description:
    "QuoteRevive follows up your old, unsold quotes automatically with a friendly 4-touch email sequence, so work you already quoted can still turn into booked jobs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
