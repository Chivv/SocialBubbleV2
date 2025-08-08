'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createCasting } from '@/app/actions/castings';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { toast } from 'sonner';

interface NewCastingClientProps {
  clients: Client[];
}

export default function NewCastingClient({ clients }: NewCastingClientProps) {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [compensation, setCompensation] = useState('');

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
        <h1 className="text-3xl font-bold">New Casting</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Social Bubble team members can create castings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !compensation) {
      toast.error('Please fill in all fields');
      return;
    }

    const compensationValue = parseFloat(compensation);
    if (isNaN(compensationValue) || compensationValue <= 0) {
      toast.error('Please enter a valid compensation amount');
      return;
    }

    setLoading(true);
    try {
      const result = await createCasting({
        client_id: clientId,
        compensation: compensationValue,
      });

      if (result.success) {
        toast.success('Casting created successfully');
        router.push(`/dashboard/castings/${result.casting?.id}`);
      } else {
        toast.error(result.error || 'Failed to create casting');
      }
    } catch (error) {
      console.error('Error creating casting:', error);
      toast.error('Failed to create casting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/castings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Casting</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Casting</CardTitle>
          <CardDescription>
            Create a new casting for a client. The casting title and max creators will be automatically set based on the client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name} ({client.creators_count} creators)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                The selected client's creator count will determine the maximum number of creators for this casting.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Compensation per Creator (€) *</Label>
              <Input
                id="compensation"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This amount will be paid to each selected creator. This information is hidden from clients.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Casting'}
              </Button>
              <Link href="/dashboard/castings">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}