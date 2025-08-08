'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Upload, FileText, Euro, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createInvoice, uploadInvoicePDF } from '@/app/actions/creator-invoices';

interface NewInvoiceClientProps {
  creator: Creator;
  submissions: any[];
}

export default function NewInvoiceClient({ creator, submissions }: NewInvoiceClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: `${creator.first_name} ${creator.last_name}`,
    iban: '',
    payment_reference: ''
  });

  const selectedSubmissionData = submissions.find(s => s.id === selectedSubmission);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission) {
      toast.error('Please select a submission');
      return;
    }
    
    if (!pdfFile) {
      toast.error('Please upload an invoice PDF');
      return;
    }

    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!formData.iban.trim()) {
      toast.error('Please enter your IBAN');
      return;
    }

    if (!formData.payment_reference.trim()) {
      toast.error('Please enter a payment reference');
      return;
    }

    setLoading(true);
    try {
      // Upload PDF first
      const uploadResult = await uploadInvoicePDF(pdfFile);
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload PDF');
      }

      // Create invoice
      const result = await createInvoice({
        creator_submission_id: selectedSubmission,
        invoice_pdf_url: uploadResult.url,
        full_name: formData.full_name,
        iban: formData.iban,
        payment_reference: formData.payment_reference
      });

      if (result.success) {
        toast.success('Invoice submitted successfully!');
        router.push('/dashboard/creator/invoices');
      } else {
        throw new Error(result.error || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/creator/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Submit Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Submission</CardTitle>
            <CardDescription>
              Choose the approved submission you want to invoice for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission">Submission</Label>
              <Select 
                value={selectedSubmission} 
                onValueChange={setSelectedSubmission}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a submission" />
                </SelectTrigger>
                <SelectContent>
                  {submissions.map((submission) => (
                    <SelectItem key={submission.id} value={submission.id}>
                      {submission.casting.title} - {submission.casting.client?.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubmissionData && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Deal Amount:</span>
                  <span className="font-medium">€{selectedSubmissionData.casting.compensation.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Enter your payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                placeholder="NL00BANK0123456789"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_reference">Payment Reference</Label>
              <Input
                id="payment_reference"
                value={formData.payment_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="Invoice #12345"
                required
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice PDF</CardTitle>
            <CardDescription>
              Upload your invoice as a PDF file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {pdfFile ? pdfFile.name : 'Choose PDF File'}
              </Button>

              {pdfFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm flex-1">{pdfFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Terms</AlertTitle>
          <AlertDescription>
            Payment will be processed within 30 days of invoice submission.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={
              loading || 
              !selectedSubmission || 
              !pdfFile ||
              !formData.full_name.trim() ||
              !formData.iban.trim() ||
              !formData.payment_reference.trim()
            }
          >
            {loading ? 'Submitting...' : 'Submit Invoice'}
          </Button>
          <Link href="/dashboard/creator/invoices">
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}