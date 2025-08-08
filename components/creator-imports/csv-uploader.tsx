'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVRow {
  email: string;
  full_name: string;
}

interface CSVUploaderProps {
  onUpload: (data: CSVRow[]) => void;
  onCancel: () => void;
}

export function CSVUploader({ onUpload, onCancel }: CSVUploaderProps) {
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const nameIndex = headers.findIndex(h => 
      h.includes('name') || h.includes('full_name') || h.includes('fullname')
    );
    
    if (emailIndex === -1 || nameIndex === -1) {
      throw new Error('CSV must contain email and name columns');
    }
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        email: values[emailIndex] || '',
        full_name: values[nameIndex] || ''
      };
    }).filter(row => row.email && row.full_name);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        
        if (data.length === 0) {
          setError('No valid data found in CSV');
          return;
        }
        
        setParsedData(data);
        setPreview(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
        setParsedData([]);
      }
    };
    
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const handleConfirm = () => {
    onUpload(parsedData);
  };

  if (preview && parsedData.length > 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preview: {parsedData.length} creators found
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setPreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Full Name</th>
                    <th className="text-left p-2 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 50).map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{row.full_name}</td>
                      <td className="p-2">{row.email}</td>
                    </tr>
                  ))}
                  {parsedData.length > 50 && (
                    <tr className="border-t bg-muted">
                      <td colSpan={2} className="p-2 text-center text-muted-foreground">
                        ... and {parsedData.length - 50} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Import {parsedData.length} Creators
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            hover:border-primary hover:bg-primary/5
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-1">
            {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            CSV should contain columns: email, full_name (or name)
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}