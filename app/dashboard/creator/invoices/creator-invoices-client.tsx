'use client';

import { useState } from 'react';
import { CreatorInvoice } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Euro, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getInvoiceSignedUrl } from '@/app/actions/creator-invoices';
import { toast } from 'sonner';

interface CreatorInvoicesClientProps {
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

export default function CreatorInvoicesClient({ invoices }: CreatorInvoicesClientProps) {
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);

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
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Invoices</h1>
          <Link href="/dashboard/creator/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Submit Invoice
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-medium mb-2">No invoices yet</p>
            <p className="text-muted-foreground mb-4">
              Submit your first invoice to get paid for approved work.
            </p>
            <Link href="/dashboard/creator/invoices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingInvoices = invoices.filter(i => i.status === 'pending_payment');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.deal_amount, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.deal_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Invoices</h1>
        <Link href="/dashboard/creator/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Submit Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices.length} invoice{paidInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            All your submitted invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Casting</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Payment Due</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status].icon;
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
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
                      {invoice.status === 'pending_payment' ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(invoice.payment_deadline), 'PP')}
                        </span>
                      ) : invoice.paid_at ? (
                        <span className="text-sm text-muted-foreground">
                          Paid on {format(new Date(invoice.paid_at), 'PP')}
                        </span>
                      ) : (
                        '-'
                      )}
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}