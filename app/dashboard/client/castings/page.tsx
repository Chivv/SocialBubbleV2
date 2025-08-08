import { getClientCastings } from '@/app/actions/castings';
import ClientCastingsClient from './client-castings-client';

export default async function ClientCastingsPage() {
  const castings = await getClientCastings();

  return <ClientCastingsClient castings={castings} />;
}