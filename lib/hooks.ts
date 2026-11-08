'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadDB, type DB } from './localstore';

// Pages in this mockup read the localStorage store after mount (the store only
// exists in the browser). `ready` flips true on mount; `refresh()` re-renders
// after a mutation so the page re-reads the live cache.
export function useClientDB(): { ready: boolean; db: DB | null; refresh: () => void } {
  const [mounted, setMounted] = useState(false);
  const [, setVersion] = useState(0);
  useEffect(() => { setMounted(true); }, []);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { ready: mounted, db: mounted ? loadDB() : null, refresh };
}
