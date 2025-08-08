'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { Client, ClientUser } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Phone, Mail, Users, Calendar, FileText, Package, Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ClientDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCastings, setPendingCastings] = useState(0);

  useEffect(() => {
    async function fetchClientData() {
      if (!user) return;

      try {
        const supabase = createClient();
        
        // First, get the client user record
        const { data: userData, error: userError } = await supabase
          .from('client_users')
          .select('*')
          .eq('clerk_user_id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching client user:', userError);
          return;
        }

        setClientUser(userData);

        // Then, get the client data
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userData.client_id)
          .single();

        if (clientError) {
          console.error('Error fetching client:', clientError);
        } else if (clientData) {
          setClient(clientData);
          
          // Fetch pending castings count
          const { count } = await supabase
            .from('castings')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientData.id)
            .eq('status', 'send_client_feedback');
          
          setPendingCastings(count || 0);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!client || !clientUser) {
    // Redirect to client signup if profile not found
    router.push('/signup/client');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Redirecting to complete your profile...</p>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'onboarding':
        return 'secondary';
      case 'active':
        return 'default';
      case 'lost':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {client.company_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your client dashboard
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(client.status)} className="text-lg px-4 py-2">
          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Your basic company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {client.website}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.contract_email}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-1">KVK Number</p>
              <p className="text-sm text-muted-foreground">{client.kvk}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Address</p>
              <p className="text-sm text-muted-foreground">{client.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Statistics</CardTitle>
            <CardDescription>Your current activity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Creators</span>
                </div>
                <p className="text-2xl font-bold">{client.creators_count}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Briefings</span>
                </div>
                <p className="text-2xl font-bold">{client.briefings_count}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Creatives</span>
                </div>
                <p className="text-2xl font-bold">{client.creatives_count}</p>
              </div>
              {client.invoice_date && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Invoice Date</span>
                  </div>
                  <p className="text-2xl font-bold">{client.invoice_date}th</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingCastings > 0 && (
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Castings Awaiting Your Review
                </CardTitle>
                <CardDescription>
                  You have {pendingCastings} casting{pendingCastings > 1 ? 's' : ''} ready for creator selection
                </CardDescription>
              </div>
              <Link href="/dashboard/client/castings">
                <Button>
                  View Castings
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
          <CardDescription>User account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-1">Your Email</p>
              <p className="text-sm text-muted-foreground">{clientUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Account Type</p>
              <p className="text-sm text-muted-foreground">
                {clientUser.is_primary ? 'Primary Account' : 'Team Member'}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-1">Member Since</p>
            <p className="text-sm text-muted-foreground">
              {new Date(client.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {client.status === 'onboarding' && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-500">
              Welcome to Social Bubble!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Your account is currently in the onboarding phase. Our team will be in touch soon
              to help you get started with your first campaign.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}