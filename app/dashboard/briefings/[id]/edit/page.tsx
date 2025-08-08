import { getBriefingById, getClients } from '@/app/actions/briefings';
import { notFound } from 'next/navigation';
import EditBriefingClient from './edit-briefing-client';

interface EditBriefingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBriefingPage({ params }: EditBriefingPageProps) {
  const { id } = await params;
  const [briefing, clients] = await Promise.all([
    getBriefingById(id),
    getClients()
  ]);

  if (!briefing) {
    notFound();
  }

  return <EditBriefingClient briefing={briefing} clients={clients} />;
}