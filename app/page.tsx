import React from 'react';
import { getTrendingStocks } from '@/lib/backend.actions';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 60; // Revalidate every minute

export default async function Page() {
  // Fetch initial trending watchlist server side
  const res = await getTrendingStocks();
  const trendingList = res?.stocks || [];

  return (
    <main className="main-container max-w-360 mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <DashboardClient initialTrending={trendingList} />
    </main>
  );
}
