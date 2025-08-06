'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Calendar, 
  Upload,
  File,
  Star,
  Briefcase,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Document {
  key: string;
  size: number;
  lastModified: string;
  type: string;
  fileName: string;
  downloadUrl: string;
  signedDownloadUrl: string;
  metadata?: {
    originalFileName?: string;
    companyName?: string;
    roleTitle?: string;
    uploadedAt?: string;
    createdAt?: string;
  };
}

export function DocumentManager() {
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = { documents: [], total: 0 }, isLoading } = useQuery<{ documents: Document[]; total: number }>({
    queryKey: ['/api/documents/list', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/documents/list?type=${activeTab}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (document: Document) => {
      const response = await fetch(document.signedDownloadUrl);
      if (!response.ok) throw new Error('Failed to get download URL');
      const { downloadUrl } = await response.json();
      
      // Open download URL in new tab
      window.open(downloadUrl, '_blank');
    },
    onSuccess: () => {
      toast({
        title: 'Download started',
        description: 'Your document download has begun.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download document',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (document: Document) => {
      const response = await fetch(`/api/documents/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: document.key }),
      });
      
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      // Refresh the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents/list'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been permanently removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'original':
        return <Upload className="w-4 h-4" />;
      case 'tailored':
        return <Star className="w-4 h-4" />;
      case 'parsed':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'original':
        return 'bg-blue-100 text-blue-800';
      case 'tailored':
        return 'bg-purple-100 text-purple-800';
      case 'parsed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Library
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage your uploaded resumes, tailored versions, and processed documents
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="original">Original Files</TabsTrigger>
            <TabsTrigger value="tailored">Tailored Resumes</TabsTrigger>
            <TabsTrigger value="parsed">Processed Data</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {documents.documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'all' 
                    ? 'Upload your first resume to get started'
                    : `No ${activeTab} documents available`
                  }
                </p>
                {activeTab === 'all' && (
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {documents.documents.map((document: Document, index: number) => (
                  <div
                    key={`${document.key}-${index}-${document.lastModified}`}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getTypeIcon(document.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium truncate">
                              {document.metadata?.originalFileName || document.fileName}
                            </h3>
                            <Badge className={getTypeBadgeColor(document.type)}>
                              {document.type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(document.lastModified)}
                            </span>
                            <span>{formatFileSize(document.size)}</span>
                            {document.metadata?.companyName && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {document.metadata.companyName}
                              </span>
                            )}
                          </div>
                          
                          {document.metadata?.roleTitle && (
                            <p className="text-xs text-gray-600 mt-1">
                              {document.metadata.roleTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadMutation.mutate(document)}
                          disabled={downloadMutation.isPending}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(document)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {documents.documents.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Total: {documents.total} documents
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}