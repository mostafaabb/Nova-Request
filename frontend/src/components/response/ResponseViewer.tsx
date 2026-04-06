'use client';

import { useRequestStore } from '@/store/requestStore';
import { cn, getStatusColor, formatResponseTime, formatJson, copyToClipboard } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { JsonViewer } from './JsonViewer';
import { Copy, Check, AlertCircle, Clock, Server, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ResponseViewer() {
  const { getActiveTab } = useRequestStore();
  const activeTab = getActiveTab();
  const [copied, setCopied] = useState(false);

  if (!activeTab) return null;

  const { response, isLoading } = activeTab;

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
      <div className="flex flex-col items-center justify-center h-full bg-muted/5">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Loader2 className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-semibold animate-pulse">Requesting Data...</p>
        <p className="text-xs text-muted-foreground mt-1">Nova-proxy is processing your request</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 opacity-40">
        <Server className="h-20 w-20 mb-6 stroke-[1.5]" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold">Ready to Send</p>
          <p className="text-xs">Select a method and URL to begin testing</p>
        </div>
      </div>
    );
  }

  if (!response.success && response.error) {
    return (
      <div className="h-full flex flex-col bg-destructive/5">
         <div className="flex items-center justify-between p-4 border-b border-destructive/20 bg-destructive/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-bold text-destructive">Network Error</span>
            </div>
            {response.responseTime && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-destructive">
                <Clock className="h-3.5 w-3.5" />
                {formatResponseTime(response.responseTime)}
              </div>
            )}
         </div>
         <div className="p-8 max-w-2xl mx-auto text-center space-y-6">
            <div className="p-6 rounded-2xl border-2 border-destructive/20 bg-background shadow-xl shadow-destructive/5">
              <p className="text-lg font-bold text-foreground">Could not send request</p>
              <p className="text-sm text-muted-foreground mt-2 font-mono bg-muted/30 p-3 rounded-lg border border-border">
                {response.error.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
               <div className="p-4 rounded-xl border border-border bg-background">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Status Code</p>
                  <p className="text-sm font-mono font-bold text-destructive">{response.status || 'N/A'}</p>
               </div>
               <div className="p-4 rounded-xl border border-border bg-background">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Search ID</p>
                  <p className="text-sm font-mono font-bold truncate">ERR-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col segment-transition">
      {/* Status bar */}
      <div className="flex items-center gap-6 p-4 border-b border-border bg-muted/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Status</span>
          <span className={cn('text-sm font-extrabold px-2 py-0.5 rounded shadow-sm', getStatusColor(response.status!))}>
            {response.status} {response.statusText}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Time</span>
          <span className="text-sm font-mono font-bold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {formatResponseTime(response.responseTime!)}
          </span>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-2 shadow-sm font-bold text-xs">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </Button>
      </div>

      {/* Response tabs */}
      <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border-b border-border px-4 bg-muted/10 shrink-0">
          <TabsList className="bg-transparent gap-6">
            <TabsTrigger value="body" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-1 h-10 font-bold text-xs uppercase">Body</TabsTrigger>
            <TabsTrigger value="headers" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-1 h-10 font-bold text-xs uppercase">
              Headers
              {response.headers && (
                <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {Object.keys(response.headers).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="raw" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-1 h-10 font-bold text-xs uppercase">Raw JSON</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 bg-background/50 relative">
          <TabsContent value="body" className="absolute inset-0 p-4 m-0 outline-none overflow-y-auto custom-scrollbar">
            <div className="bg-background rounded-xl border border-border p-4 shadow-inner min-h-full">
              <JsonViewer data={response.data} />
            </div>
          </TabsContent>
          
          <TabsContent value="headers" className="absolute inset-0 p-4 m-0 outline-none overflow-y-auto custom-scrollbar">
            <div className="space-y-1.5">
              {response.headers && Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-4 p-2.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors group">
                  <span className="text-xs font-mono font-bold text-primary min-w-[150px]">{key}</span>
                  <span className="text-xs font-mono text-muted-foreground break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="absolute inset-0 p-4 m-0 outline-none overflow-y-auto custom-scrollbar">
            <div className="bg-muted min-h-full rounded-xl p-4 border border-border">
              <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all text-muted-foreground">
                {formatJson(response.data)}
              </pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}