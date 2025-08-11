'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatorImport } from '@/types';
import { 
  importCreatorsFromCSV, 
  sendCreatorInvitation, 
  sendBulkInvitations, 
  sendFollowUpEmail,
  deleteImportedCreator,
  exportCreatorsCSV
} from '@/app/actions/creator-imports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CSVUploader } from '@/components/creator-imports/csv-uploader';
import { toast } from 'sonner';
import { 
  Upload, 
  Send, 
  Mail, 
  Search, 
  Download, 
  Trash2, 
  UserCheck, 
  UserX,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface CreatorImportsClientProps {
  initialCreators: CreatorImport[];
}

export default function CreatorImportsClient({ initialCreators }: CreatorImportsClientProps) {
  const router = useRouter();
  const [creators, setCreators] = useState(initialCreators);
  const [loading, setLoading] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'signed_up' | 'not_signed_up'>('all');
  
  // Filter creators based on search and status
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = 
      creator.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'signed_up' && creator.signed_up_at) ||
      (statusFilter === 'not_signed_up' && !creator.signed_up_at);
    
    return matchesSearch && matchesStatus;
  });
  
  // Statistics
  const stats = {
    total: creators.length,
    signedUp: creators.filter(c => c.signed_up_at).length,
    invited: creators.filter(c => c.invitation_sent_at).length,
    followedUp: creators.filter(c => c.follow_up_sent_at).length,
  };
  
  const handleImport = async (data: { email: string; full_name: string }[]) => {
    setLoading(true);
    try {
      const result = await importCreatorsFromCSV(data);
      if (result.success) {
        let message = `Imported ${result.imported} creators`;
        if (result.skipped && result.skipped > 0) {
          message += ` (${result.skipped} duplicates skipped)`;
        }
        if (result.invalidEmails && result.invalidEmails > 0) {
          message += ` (${result.invalidEmails} invalid emails)`;
        }
        toast.success(message);
        setShowUpload(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to import');
      }
    } catch (error) {
      toast.error('Failed to import creators');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendInvitation = async (creatorId: string) => {
    setLoading(true);
    try {
      const result = await sendCreatorInvitation(creatorId);
      if (result.success) {
        toast.success('Invitation sent');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendBulkInvitations = async () => {
    if (selectedCreators.length === 0) {
      toast.error('No creators selected');
      return;
    }
    
    console.log('Sending bulk invitations for selected creators:', selectedCreators);
    
    setLoading(true);
    try {
      const result = await sendBulkInvitations(selectedCreators);
      if (result.success) {
        toast.success(`Sent ${result.sent} invitations`);
        setSelectedCreators([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send invitations');
      }
    } catch (error) {
      toast.error('Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendFollowUp = async (creatorId: string) => {
    setLoading(true);
    try {
      const result = await sendFollowUpEmail(creatorId);
      if (result.success) {
        toast.success('Follow-up sent');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send follow-up');
      }
    } catch (error) {
      toast.error('Failed to send follow-up');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (creatorId: string) => {
    if (!confirm('Are you sure you want to delete this creator?')) return;
    
    setLoading(true);
    try {
      const result = await deleteImportedCreator(creatorId);
      if (result.success) {
        toast.success('Creator deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete creator');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportCreatorsCSV(statusFilter);
      if (result.success && result.data) {
        // Convert to CSV
        const csv = [
          ['Email', 'Full Name', 'Imported', 'Invited', 'Followed Up', 'Signed Up'],
          ...result.data.map(c => [
            c.email,
            c.full_name,
            format(new Date(c.imported_at), 'yyyy-MM-dd'),
            c.invitation_sent_at ? format(new Date(c.invitation_sent_at), 'yyyy-MM-dd') : '',
            c.follow_up_sent_at ? format(new Date(c.follow_up_sent_at), 'yyyy-MM-dd') : '',
            c.signed_up_at ? format(new Date(c.signed_up_at), 'yyyy-MM-dd') : '',
          ])
        ].map(row => row.join(',')).join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `creators-${statusFilter}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };
  
  const selectAll = () => {
    const eligibleCreators = filteredCreators.filter(c => !c.signed_up_at && !c.invitation_sent_at);
    const visibleIds = eligibleCreators.map(c => c.id);
    
    console.log('Select All - Filtered creators:', filteredCreators.length);
    console.log('Select All - Eligible creators:', eligibleCreators.length);
    console.log('Select All - Setting selected creator IDs:', visibleIds);
    
    if (visibleIds.length === 0) {
      toast.info('No eligible creators to select. All visible creators have already been invited or signed up.');
      return;
    }
    
    setSelectedCreators(visibleIds);
    toast.success(`Selected ${visibleIds.length} creators`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Imports</h1>
          <p className="text-muted-foreground mt-1">
            Import and invite creators to join the platform
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} disabled={loading}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </div>
      
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Imported</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Signed Up</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {stats.signedUp}
              <span className="text-sm font-normal text-muted-foreground">
                ({stats.total > 0 ? Math.round((stats.signedUp / stats.total) * 100) : 0}%)
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invited</CardDescription>
            <CardTitle className="text-2xl">{stats.invited}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Followed Up</CardDescription>
            <CardTitle className="text-2xl">{stats.followedUp}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Imported Creators</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {selectedCreators.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleSendBulkInvitations}
                  disabled={loading}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send {selectedCreators.length} Invites
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: any) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                <SelectItem value="signed_up">Signed Up</SelectItem>
                <SelectItem value="not_signed_up">Not Signed Up</SelectItem>
              </SelectContent>
            </Select>
            {filteredCreators.some(c => !c.signed_up_at && !c.invitation_sent_at) && (
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
            )}
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No creators found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCreators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell>
                        {!creator.signed_up_at && (
                          <Checkbox
                            checked={selectedCreators.includes(creator.id)}
                            onCheckedChange={() => toggleCreatorSelection(creator.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{creator.full_name}</TableCell>
                      <TableCell>{creator.email}</TableCell>
                      <TableCell>
                        {creator.signed_up_at ? (
                          <Badge variant="default" className="bg-green-500">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Signed Up
                          </Badge>
                        ) : creator.invitation_sent_at ? (
                          <Badge variant="secondary">
                            <Mail className="h-3 w-3 mr-1" />
                            Invited
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <UserX className="h-3 w-3 mr-1" />
                            Not Invited
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(creator.imported_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!creator.signed_up_at && !creator.invitation_sent_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvitation(creator.id)}
                              disabled={loading}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          {creator.invitation_sent_at && !creator.signed_up_at && !creator.follow_up_sent_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendFollowUp(creator.id)}
                              disabled={loading}
                              title="Send follow-up"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(creator.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Creators from CSV</DialogTitle>
          </DialogHeader>
          <CSVUploader
            onUpload={handleImport}
            onCancel={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}