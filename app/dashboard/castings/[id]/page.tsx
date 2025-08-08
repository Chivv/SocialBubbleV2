import { getCastingById, getCastingInvitations, getCastingSelections } from '@/app/actions/castings';
import { getCreatorsForCasting } from '@/app/actions/castings';
import { 
  getCastingBriefings, 
  getAvailableBriefingsForCasting,
  getCreatorSubmissions 
} from '@/app/actions/casting-briefings';
import CastingDetailClient from './casting-detail-client';

export default async function CastingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const casting = await getCastingById(id);
  
  if (!casting) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Casting Not Found</h1>
        <p>The casting you're looking for doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  const invitations = await getCastingInvitations(id);
  const selections = await getCastingSelections(id);
  const allCreators = await getCreatorsForCasting();
  const linkedBriefings = await getCastingBriefings(id);
  const availableBriefings = await getAvailableBriefingsForCasting(id);
  const creatorSubmissions = await getCreatorSubmissions(id);

  return (
    <CastingDetailClient 
      casting={casting}
      invitations={invitations}
      selections={selections}
      allCreators={allCreators}
      linkedBriefings={linkedBriefings}
      availableBriefings={availableBriefings}
      creatorSubmissions={creatorSubmissions}
    />
  );
}