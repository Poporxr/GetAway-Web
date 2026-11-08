import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Logo, TestModeBanner } from '@/components/ui';
import HeaderNav from '@/components/HeaderNav';

export const metadata: Metadata = {
  title: 'SignOut — the digital signing-out shirt',
  description: 'Create a free virtual signing-out shirt, share the link, and let friends gift and sign it in 3D from anywhere.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-paper font-sans text-stone-900 antialiased">
        <TestModeBanner />
        <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" aria-label="SignOut home"><Logo /></Link>
            <HeaderNav />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200/80 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs leading-relaxed text-stone-400">
            <p className="font-semibold text-stone-500">SignOut — sign the shirt, from anywhere.</p>
            <p className="mt-1">
              3D models: “Tshirt” by Tabbuso (CC-BY 4.0, via Sketchfab) and “elvs_male_shirt_untucked_bd1”
              by Elvaerwyn (CC-BY, via MakeHuman Community). Prototype build — payments are mocked in test mode.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
