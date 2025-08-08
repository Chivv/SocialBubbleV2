import { notFound } from 'next/navigation';
import { getCardDetails } from '@/app/actions/creative-agenda';
import { CardDetailClient } from './card-detail-client';

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCardDetails(id);

  if (!card) {
    notFound();
  }

  return <CardDetailClient card={card} />;
}