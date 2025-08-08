import { getBriefings, getClients } from '@/app/actions/briefings';
import BriefingsClient from './briefings-client';

export default async function BriefingsListPage() {
  const [briefings, clients] = await Promise.all([
    getBriefings(),
    getClients()
  ]);

  return <BriefingsClient initialBriefings={briefings} initialClients={clients} />;
}