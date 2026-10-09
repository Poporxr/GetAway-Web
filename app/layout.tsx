import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Getaway — What should you do with your free time?",
  description:
    "Getaway turns your free time into real plans: tell it how you feel and how much time you have, get a decision — not a directory.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Getaway",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0E0C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-200 text-neutral-950 antialiased">
        {/* Phone-like column: full-width on mobile, centered on desktop */}
        <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
