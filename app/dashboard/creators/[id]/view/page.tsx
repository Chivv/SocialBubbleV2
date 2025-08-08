import { getCreatorById } from '@/app/actions/creators';
import CreatorProfileView from './creator-profile-view';

export default async function CreatorViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creator = await getCreatorById(id);
  
  if (!creator) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Creator Not Found</h1>
        <p>The creator profile you're looking for doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  return <CreatorProfileView creator={creator} />;
}