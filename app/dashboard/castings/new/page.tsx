import { getClients } from '@/app/actions/briefings';
import NewCastingClient from './new-casting-client';

export default async function NewCastingPage() {
  const clients = await getClients();

  return <NewCastingClient clients={clients} />;
}