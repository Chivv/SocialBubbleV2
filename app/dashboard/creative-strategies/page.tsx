import { Suspense } from 'react';
import CreativeStrategiesClient from './creative-strategies-client';
import { getCreativeStrategies } from '@/app/actions/creative-strategies';

export default async function CreativeStrategiesPage() {
  const strategies = await getCreativeStrategies();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreativeStrategiesClient strategies={strategies} />
    </Suspense>
  );
}