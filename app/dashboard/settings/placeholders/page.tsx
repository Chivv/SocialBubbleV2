import { getGlobalPlaceholders } from '@/app/actions/placeholders';
import PlaceholdersClient from './placeholders-client';

export default async function PlaceholdersPage() {
  const placeholders = await getGlobalPlaceholders();
  
  return <PlaceholdersClient initialPlaceholders={placeholders} />;
}