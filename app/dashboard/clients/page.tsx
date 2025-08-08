'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client, ClientStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Building2, Phone, Mail, Calendar, Users, FileText, Package, Edit, Lightbulb } from 'lucide-react';
import BriefingEditor from '@/components/briefings/editor';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/briefings/status-badge';
import { toast } from 'sonner';
import { CreativeStrategy } from '@/types';

const clientMetadataSchema = z.object({
  status: z.enum(['onboarding', 'active', 'lost']),
  creators_count: z.number().min(0),
  briefings_count: z.number().min(0),
  creatives_count: z.number().min(0),
  invoice_date: z.number().min(1).max(31).optional(),
  drive_folder_url: z.string().optional(),
});

type ClientMetadataForm = z.infer<typeof clientMetadataSchema>;

export default function ClientsListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [creativeStrategies, setCreativeStrategies] = useState<Record<string, CreativeStrategy>>({});
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [briefingOverviewContent, setBriefingOverviewContent] = useState<any>(null);

  const form = useForm<ClientMetadataForm>({
    resolver: zodResolver(clientMetadataSchema),
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const supabase = createClient();
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      } else if (clientsData) {
        setClients(clientsData);
        setFilteredClients(clientsData);
        
        // Fetch creative strategies for all clients
        const { data: strategiesData, error: strategiesError } = await supabase
          .from('creative_strategies')
          .select('*')
          .in('client_id', clientsData.map(c => c.id));
          
        if (!strategiesError && strategiesData) {
          const strategiesMap: Record<string, CreativeStrategy> = {};
          strategiesData.forEach(strategy => {
            strategiesMap[strategy.client_id] = strategy;
          });
          setCreativeStrategies(strategiesMap);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client => {
        const searchLower = searchTerm.toLowerCase();
        return (
          client.company_name.toLowerCase().includes(searchLower) ||
          client.website.toLowerCase().includes(searchLower) ||
          client.contract_email.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  }, [searchTerm, statusFilter, clients]);

  const getStatusBadgeVariant = (status: ClientStatus) => {
    switch (status) {
      case 'onboarding':
        return 'secondary';
      case 'active':
        return 'default';
      case 'lost':
        return 'destructive';
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setBriefingOverviewContent(client.briefing_client_overview || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    });
    form.reset({
      status: client.status,
      creators_count: client.creators_count,
      briefings_count: client.briefings_count,
      creatives_count: client.creatives_count,
      invoice_date: client.invoice_date || undefined,
      drive_folder_url: client.drive_folder_url || '',
    });
  };

  const onSubmit = async (data: ClientMetadataForm) => {
    if (!editingClient) return;

    setSaving(true);
    try {
      const supabase = createClient();
      
      // Extract folder ID from Drive URL if provided
      let driveFolderId = null;
      if (data.drive_folder_url) {
        const folderIdMatch = data.drive_folder_url.match(/folders\/([a-zA-Z0-9-_]+)/);
        if (folderIdMatch) {
          driveFolderId = folderIdMatch[1];
        }
      }
      
      const { error } = await supabase
        .from('clients')
        .update({
          status: data.status,
          creators_count: data.creators_count,
          briefings_count: data.briefings_count,
          creatives_count: data.creatives_count,
          invoice_date: data.invoice_date || null,
          briefing_client_overview: briefingOverviewContent,
          drive_folder_url: data.drive_folder_url || null,
          drive_folder_id: driveFolderId,
        })
        .eq('id', editingClient.id);

      if (error) {
        console.error('Supabase error:', error);
        toast.error(`Failed to update client: ${error.message}`);
        throw error;
      }

      // Refresh clients list
      await fetchClients();
      setEditingClient(null);
      setBriefingOverviewContent(null);
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Failed to update client');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Clients</h1>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ClientStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {client.company_name}
                  </CardTitle>
                  <CardDescription>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {client.website}
                    </a>
                  </CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${client.contract_email}`} className="hover:underline">
                    {client.contract_email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{client.creators_count} Creators</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span>{client.briefings_count} Briefings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span>{client.creatives_count} Creatives</span>
                </div>
                {client.invoice_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Invoice: {client.invoice_date}th</span>
                  </div>
                )}
              </div>

              {creativeStrategies[client.id] && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Creative Strategy</span>
                  </div>
                  <StatusBadge status={creativeStrategies[client.id].status} />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  KVK: {client.kvk}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/creative-strategies/${client.id}`)}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Strategy
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Client Metadata</DialogTitle>
                      <DialogDescription>
                        Update status and metadata for {editingClient?.company_name}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="onboarding">Onboarding</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="creators_count"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Creators Count</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="briefings_count"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Briefings Count</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="creatives_count"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Creatives Count</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="invoice_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Invoice Date (Day)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="1-31"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="drive_folder_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Google Drive Folder</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://drive.google.com/drive/folders/..."
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                Paste the URL of the client&apos;s main Google Drive folder. A RAW folder will be created inside for creator uploads.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <FormLabel>Briefing Client Overview</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            This content will replace the {'{{briefing_client_overview}}'} placeholder in briefings for this client.
                          </p>
                          <BriefingEditor
                            content={briefingOverviewContent}
                            onChange={setBriefingOverviewContent}
                          />
                        </div>


                        <div className="flex justify-end">
                          <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No clients found matching your filters.</p>
        </div>
      )}
    </div>
  );
}