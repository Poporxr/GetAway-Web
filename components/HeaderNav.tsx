'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSessionUserId } from '@/lib/localstore';

// Session lives in localStorage, so the signed-in state of the header can only
// be known after mount. Pre-mount renders the signed-out variant.
export default function HeaderNav() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(Boolean(getSessionUserId())); }, []);
  return (
    <nav className="flex items-center gap-2 text-sm font-semibold">
      <Link href="/#how" className="hidden rounded-full px-3 py-2 text-stone-600 hover:bg-stone-100 sm:block">How it works</Link>
      <Link href="/#pricing" className="hidden rounded-full px-3 py-2 text-stone-600 hover:bg-stone-100 sm:block">Pricing</Link>
      {signedIn ? (
        <Link href="/dashboard" className="rounded-full bg-violet-600 px-4 py-2 text-white hover:bg-violet-700">My dashboard</Link>
      ) : (
        <>
          <Link href="/login" className="rounded-full px-3 py-2 text-stone-700 hover:bg-stone-100">Log in</Link>
          <Link href="/signup" className="rounded-full bg-violet-600 px-4 py-2 text-white hover:bg-violet-700">Create my shirt</Link>
        </>
      )}
    </nav>
  );
}
