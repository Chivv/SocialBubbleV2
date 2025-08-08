import { getCastings } from '@/app/actions/castings';
import { getClients } from '@/app/actions/briefings';
import CastingsClient from './castings-client';

export default async function CastingsPage() {
  const castings = await getCastings();
  const clients = await getClients();

  return <CastingsClient initialCastings={castings} clients={clients} />;
}