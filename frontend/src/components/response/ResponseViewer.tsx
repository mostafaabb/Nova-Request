'use client';

import { useRequestStore } from '@/store/requestStore';
import { cn, getStatusColor, formatResponseTime, formatJson, copyToClipboard } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { JsonViewer } from './JsonViewer';
import { Copy, Check, AlertCircle, Clock, Server } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ResponseViewer() {
  const { response, isLoading } = useRequestStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!response?.data) return;
    
    try {
      await copyToClipboard(formatJson(response.data));
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Send a request to see the response</p>
        </div>
      </div>
    );
  }

  if (!response.success && response.error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-destructive mb-4">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Request Failed</span>
        </div>
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="font-medium">{response.error.message}</p>
          {response.error.code && (
            <p className="text-sm text-muted-foreground mt-1">
              Error code: {response.error.code}
            </p>
          )}
        </div>
        {response.responseTime && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-4">
            <Clock className="h-4 w-4" />
            {formatResponseTime(response.responseTime)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span className={cn('font-semibold', getStatusColor(response.status!))}>
            {response.status} {response.statusText}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {formatResponseTime(response.responseTime!)}
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {/* Response tabs */}
      <Tabs defaultValue="body" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-4">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">
              Headers
              {response.headers && (
                <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">
                  {Object.keys(response.headers).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="body" className="p-4 h-full">
            <JsonViewer data={response.data} />
          </TabsContent>
          
          <TabsContent value="headers" className="p-4">
            <div className="space-y-2">
              {response.headers && Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 font-mono text-sm">
                  <span className="text-primary font-semibold">{key}:</span>
                  <span className="text-muted-foreground">{String(value)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="p-4 h-full">
            <pre className="font-mono text-sm whitespace-pre-wrap break-all">
              {formatJson(response.data)}
            </pre>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}