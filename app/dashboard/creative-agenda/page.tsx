import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CreativeAgendaHub } from './creative-agenda-hub';

export default async function CreativeAgendaPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServiceClient();
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', user.id)
    .single();

  if (roleData?.role !== 'social_bubble') {
    redirect('/dashboard');
  }

  // Get card counts by department
  const { data: conceptingCards } = await supabase
    .from('creative_agenda_cards')
    .select('id')
    .eq('department', 'concepting');
    
  const { data: editingCards } = await supabase
    .from('creative_agenda_cards')
    .select('id')
    .eq('department', 'editing');
    
  const { data: publicationCards } = await supabase
    .from('creative_agenda_cards')
    .select('id')
    .eq('department', 'publication');

  const stats = {
    concepting: conceptingCards?.length || 0,
    editing: editingCards?.length || 0,
    publication: publicationCards?.length || 0,
  };

  return <CreativeAgendaHub stats={stats} />;
}