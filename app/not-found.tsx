import Link from 'next/link';
import { Shirt } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Shirt className="mx-auto text-stone-300" size={52} />
      <h1 className="mt-3 text-2xl font-extrabold text-stone-900">This shirt doesn&apos;t exist</h1>
      <p className="mt-1 text-sm text-stone-500">The link may be wrong, or the shirt was removed. Check the link and try again.</p>
      <Link href="/" className="mt-5 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700">
        Back to SignOut home
      </Link>
    </div>
  );
}
