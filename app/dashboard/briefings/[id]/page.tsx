import { getBriefingById, getBriefingComments } from '@/app/actions/briefings';
import { notFound } from 'next/navigation';
import BriefingDetailClient from './briefing-detail-client';
import { currentUser } from '@clerk/nextjs/server';

interface BriefingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BriefingDetailPage({ params }: BriefingDetailPageProps) {
  const { id } = await params;
  const user = await currentUser();
  
  if (!user) {
    notFound();
  }
  
  const [briefing, comments] = await Promise.all([
    getBriefingById(id),
    getBriefingComments(id)
  ]);

  if (!briefing) {
    notFound();
  }

  return <BriefingDetailClient briefing={briefing} comments={comments} currentUserId={user.id} />;
}