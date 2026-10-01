import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Getaway — What should you do with your free time?",
  description:
    "Getaway turns your free time into real plans: tell it how you feel and how much time you have, get a decision — not a directory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
