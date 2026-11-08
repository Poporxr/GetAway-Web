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
      <body className="flex min-h-screen flex-col bg-paper font-sans">
        <TestModeBanner />
        <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" aria-label="SignOut home"><Logo /></Link>
            <HeaderNav />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200/70 py-6">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs leading-relaxed text-stone-400">
            <p className="font-semibold text-stone-500">SignOut — sign the shirt, from anywhere. 🎓</p>
            <p className="mt-1">
              3D models: “T-shirt” by Poly by Google and “T Shirt” by Nour, both CC-BY 3.0 via Poly Pizza.
              Prototype build — payments are mocked in test mode.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
