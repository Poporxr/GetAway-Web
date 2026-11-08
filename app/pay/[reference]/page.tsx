import PayClient from '@/components/PayClient';

export default async function PayPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <PayClient reference={reference} />;
}
