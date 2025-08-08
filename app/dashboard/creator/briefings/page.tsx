import { getCreatorBriefings } from '@/app/actions/casting-briefings';
import CreatorBriefingsClient from './creator-briefings-client';

export default async function CreatorBriefingsPage() {
  const briefings = await getCreatorBriefings();

  return <CreatorBriefingsClient briefings={briefings} />;
}