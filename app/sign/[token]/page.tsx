import SignFlow from '@/components/SignFlow';

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignFlow token={token} />;
}
