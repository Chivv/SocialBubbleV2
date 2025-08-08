'use client';

import { useState } from 'react';
import { CreativeStrategy } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/briefings/status-badge';
import { useRouter } from 'next/navigation';
import { Search, FileText, Eye, Edit, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserRole } from '@/lib/hooks/use-user-role';

interface CreativeStrategiesClientProps {
  strategies: CreativeStrategy[];
}

export default function CreativeStrategiesClient({ strategies }: CreativeStrategiesClientProps) {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStrategies = strategies.filter(strategy => {
    const searchLower = searchTerm.toLowerCase();
    return (
      strategy.client?.company_name?.toLowerCase().includes(searchLower) ||
      strategy.status.toLowerCase().includes(searchLower)
    );
  });

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
        <h1 className="text-3xl font-bold">Creative Strategies</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Social Bubble team members can access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Creative Strategies</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Creative Strategies</CardTitle>
          <CardDescription>
            Manage creative strategies for all clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredStrategies.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No creative strategies found matching your search.' : 'No creative strategies found.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStrategies.map((strategy) => (
                    <TableRow key={strategy.id}>
                      <TableCell className="font-medium">
                        {strategy.client?.company_name || 'Unknown Client'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={strategy.status} />
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(strategy.updated_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/creative-strategies/${strategy.client_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/creative-strategies/${strategy.client_id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}