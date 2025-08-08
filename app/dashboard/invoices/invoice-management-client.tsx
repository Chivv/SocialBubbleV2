'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatorInvoice } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Euro, Calendar, ExternalLink, Clock, 
  CheckCircle, AlertTriangle, Search, Filter 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { updateInvoiceStatus, getInvoiceSignedUrl } from '@/app/actions/creator-invoices';

interface InvoiceManagementClientProps {
  invoices: CreatorInvoice[];
}

const statusConfig = {
  pending_payment: {
    label: 'Pending Payment',
    color: 'bg-yellow-500',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
};

export default function InvoiceManagementClient({ invoices }: InvoiceManagementClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_payment' | 'paid'>('all');

  const handleViewInvoice = async (invoiceId: string, pdfPath: string) => {
    setLoadingInvoice(invoiceId);
    try {
      const signedUrl = await getInvoiceSignedUrl(pdfPath);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        toast.error('Failed to load invoice PDF');
      }
    } catch (error) {
      toast.error('Failed to load invoice PDF');
    } finally {
      setLoadingInvoice(null);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' || 
      invoice.creator?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.creator?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.casting?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.casting?.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleMarkAsPaid = async (invoiceId: string) => {
    setLoading(invoiceId);
    try {
      const result = await updateInvoiceStatus(invoiceId, 'paid');
      if (result.success) {
        toast.success('Invoice marked as paid');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update invoice');
      }
    } catch (error) {
      toast.error('Failed to update invoice');
    } finally {
      setLoading(null);
    }
  };

  const getDeadlineColor = (deadline: string, status: string) => {
    if (status === 'paid') return '';
    
    const daysUntilDeadline = differenceInDays(new Date(deadline), new Date());
    
    if (daysUntilDeadline < 0) return 'text-red-600 font-medium';
    if (daysUntilDeadline <= 7) return 'text-orange-600 font-medium';
    if (daysUntilDeadline <= 14) return 'text-yellow-600';
    return '';
  };

  const pendingInvoices = invoices.filter(i => i.status === 'pending_payment');
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.deal_amount, 0);
  const overdueInvoices = pendingInvoices.filter(i => 
    differenceInDays(new Date(i.payment_deadline), new Date()) < 0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Invoice Management</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingInvoices.filter(i => {
                const days = differenceInDays(new Date(i.payment_deadline), new Date());
                return days >= 0 && days <= 7;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need processing soon
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Manage creator invoice payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by creator, casting, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Casting</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Payment Deadline</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status].icon;
                const daysUntilDeadline = differenceInDays(new Date(invoice.payment_deadline), new Date());
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.creator?.first_name} {invoice.creator?.last_name}
                    </TableCell>
                    <TableCell>
                      {invoice.casting?.title}
                    </TableCell>
                    <TableCell>
                      {invoice.casting?.client?.company_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {invoice.deal_amount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[invoice.status].color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[invoice.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.submitted_at), 'PP')}
                    </TableCell>
                    <TableCell>
                      <span className={getDeadlineColor(invoice.payment_deadline, invoice.status)}>
                        {invoice.status === 'pending_payment' ? (
                          <>
                            {format(new Date(invoice.payment_deadline), 'PP')}
                            {daysUntilDeadline < 0 && (
                              <span className="block text-xs">
                                Overdue by {Math.abs(daysUntilDeadline)} days
                              </span>
                            )}
                            {daysUntilDeadline >= 0 && daysUntilDeadline <= 7 && (
                              <span className="block text-xs">
                                Due in {daysUntilDeadline} days
                              </span>
                            )}
                          </>
                        ) : invoice.paid_at ? (
                          <span className="text-sm text-muted-foreground">
                            Paid on {format(new Date(invoice.paid_at), 'PP')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.id, invoice.invoice_pdf_url)}
                        disabled={loadingInvoice === invoice.id}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'pending_payment' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          disabled={loading === invoice.id}
                        >
                          {loading === invoice.id ? 'Processing...' : 'Mark as Paid'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No invoices found matching your search criteria.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}