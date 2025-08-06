'use client';

import React, { useState, useEffect } from 'react';

interface ClientPDFViewerProps {
  file: string | null;
  onLoadSuccess?: (data: { numPages: number }) => void;
  onLoadError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

export function ClientPDFViewer({ file, onLoadSuccess, onLoadError, className, children }: ClientPDFViewerProps) {
  const [Document, setDocument] = useState<any>(null);
  const [Page, setPage] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load react-pdf only on client side
    import('react-pdf').then((reactPdf) => {
      // Configure worker
      reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
      
      setDocument(() => reactPdf.Document);
      setPage(() => reactPdf.Page);
    });
  }, []);

  if (!isClient || !Document || !Page) {
    return <div className={className}>Loading PDF viewer...</div>;
  }

  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      className={className}
    >
      {children}
    </Document>
  );
}

export function ClientPDFPage({ pageNumber, ...props }: { pageNumber: number; [key: string]: any }) {
  const [Page, setPage] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    import('react-pdf').then((reactPdf) => {
      setPage(() => reactPdf.Page);
    });
  }, []);

  if (!isClient || !Page) {
    return <div>Loading page...</div>;
  }

  return <Page pageNumber={pageNumber} {...props} />;
}