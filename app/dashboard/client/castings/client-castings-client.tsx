'use client';

import { useState } from 'react';
import { Casting } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Users, Calendar, Camera, Check } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ClientCastingsClientProps {
  castings: Casting[];
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
  send_client_feedback: 'Awaiting Your Feedback',
  approved_by_client: 'Approved',
  shooting: 'Shooting',
  done: 'Done',
};

export default function ClientCastingsClient({ castings }: ClientCastingsClientProps) {
  const [selectedCastings] = useState<Casting[]>(castings);

  const pendingFeedback = castings.filter(c => c.status === 'send_client_feedback');
  const approvedOrCompleted = castings.filter(c => 
    ['approved_by_client', 'shooting', 'done'].includes(c.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Castings</h1>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">{castings.length} total</span>
        </div>
      </div>

      {pendingFeedback.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-purple-500 text-white">Action Required</Badge>
              Castings Awaiting Your Selection
            </CardTitle>
            <CardDescription>
              Please review and select creators for these castings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingFeedback.map((casting) => (
                <div key={casting.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <p className="font-medium">{casting.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {casting._count?.selections || 0} creators pre-selected for your review
                    </p>
                  </div>
                  <Link href={`/dashboard/castings/${casting.id}`}>
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Review & Select
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Castings</CardTitle>
          <CardDescription>
            View all your castings and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {castings.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-medium mb-2">No castings yet</p>
              <p className="text-muted-foreground">
                When Social Bubble creates castings for you, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Max Creators</TableHead>
                  <TableHead>Selections</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {castings.map((casting) => (
                  <TableRow key={casting.id}>
                    <TableCell className="font-medium">{casting.title}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[casting.status]} text-white`}>
                        {statusLabels[casting.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {casting.max_creators}
                      </div>
                    </TableCell>
                    <TableCell>
                      {casting.status === 'send_client_feedback' ? (
                        <span className="text-purple-600 font-medium">
                          {casting._count?.selections || 0} to review
                        </span>
                      ) : casting.status === 'approved_by_client' || casting.status === 'shooting' || casting.status === 'done' ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Approved
                        </span>
                      ) : (
                        '-'
                      )}
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