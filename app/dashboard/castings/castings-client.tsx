'use client';

import { useState } from 'react';
import { Casting, Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Users, Euro, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CastingsClientProps {
  initialCastings: Casting[];
  clients: Client[];
}

const statusColors: Record<Casting['status'], string> = {
  draft: 'bg-gray-500',
  inviting: 'bg-blue-500',
  check_intern: 'bg-yellow-500',
  send_client_feedback: 'bg-purple-500',
  approved_by_client: 'bg-green-500',
  shooting: 'bg-orange-500',
  done: 'bg-gray-700',
};

const statusLabels: Record<Casting['status'], string> = {
  draft: 'Draft',
  inviting: 'Inviting',
  check_intern: 'Check Intern',
  send_client_feedback: 'Send to Client',
  approved_by_client: 'Approved',
  shooting: 'Shooting',
  done: 'Done',
};

export default function CastingsClient({ initialCastings, clients }: CastingsClientProps) {
  const { role, loading: roleLoading } = useUserRole();
  const [castings] = useState<Casting[]>(initialCastings);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (role !== 'social_bubble') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Castings</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Social Bubble team members can manage castings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Castings</h1>
        <Link href="/dashboard/castings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Casting
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Castings</CardTitle>
          <CardDescription>
            Manage creator castings for your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {castings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No castings created yet</p>
              <Link href="/dashboard/castings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Casting
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Compensation</TableHead>
                  <TableHead>Max Creators</TableHead>
                  <TableHead>Invitations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {castings.map((casting) => (
                  <TableRow key={casting.id}>
                    <TableCell className="font-medium">{casting.title}</TableCell>
                    <TableCell>{casting.client?.company_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[casting.status]} text-white`}>
                        {statusLabels[casting.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {casting.compensation.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {casting.max_creators}
                      </div>
                    </TableCell>
                    <TableCell>
                      {casting._count?.acceptedInvitations || 0} / {casting._count?.invitations || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(casting.created_at), 'PP')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/castings/${casting.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}