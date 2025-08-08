import { getCreatorOpportunities } from '@/app/actions/castings';
import OpportunitiesClient from './opportunities-client';

export default async function OpportunitiesPage() {
  const opportunities = await getCreatorOpportunities();

  return <OpportunitiesClient opportunities={opportunities} />;
}