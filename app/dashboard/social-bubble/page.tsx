'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SocialBubbleDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Social Bubble Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/creators">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Creators
              </CardTitle>
              <CardDescription>
                View and manage all creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">View All</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/clients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clients
              </CardTitle>
              <CardDescription>
                View and manage all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">View All</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              Platform statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}