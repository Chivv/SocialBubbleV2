import { getCreatorBriefings } from '@/app/actions/casting-briefings';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CreatorBriefingDetail from './creator-briefing-detail';

export default async function CreatorBriefingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const briefings = await getCreatorBriefings();
  const briefingLink = briefings.find(b => b.briefing.id === id);

  if (!briefingLink) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Briefing Not Found</h1>
        <p>The briefing you're looking for doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  return <CreatorBriefingDetail briefingLink={briefingLink} />;
}