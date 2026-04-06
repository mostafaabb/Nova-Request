'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collectionApi } from '@/lib/api';
import { Collection, Endpoint } from '@/types';
import { cn, getMethodColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Book, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DocsPage() {
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await collectionApi.getOne(params.collectionId as string);
        setCollection(response.data.collection);
      } catch (error) {
        toast.error('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [params.collectionId]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">{collection.name} - API Documentation</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {collection.description && (
          <p className="text-muted-foreground mb-8">{collection.description}</p>
        )}

        <div className="space-y-8">
          {collection.endpoints?.map((endpoint, index) => (
            <section key={endpoint.id} className="border border-border rounded-lg overflow-hidden">
              {/* Endpoint Header */}
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'px-2 py-1 rounded text-sm font-mono font-bold bg-background',
                    getMethodColor(endpoint.method)
                  )}>
                    {endpoint.method}
                  </span>
                  <span className="font-semibold">{endpoint.name}</span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* URL */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Endpoint</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                      {endpoint.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(endpoint.url, endpoint.id)}
                    >
                      {copiedId === endpoint.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {endpoint.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p>{endpoint.description}</p>
                  </div>
                )}

                {/* Headers */}
                {endpoint.headers && (endpoint.headers as any[]).filter(h => h.key).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Headers</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Name</th>
                          <th className="text-left py-2 font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(endpoint.headers as any[]).filter(h => h.key).map((header, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="py-2 font-mono text-primary">{header.key}</td>
                            <td className="py-2 font-mono">{header.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Query Params */}
                {endpoint.queryParams && (endpoint.queryParams as any[]).filter(p => p.key).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Query Parameters</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Name</th>
                          <th className="text-left py-2 font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(endpoint.queryParams as any[]).filter(p => p.key).map((param, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="py-2 font-mono text-primary">{param.key}</td>
                            <td className="py-2 font-mono">{param.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Request Body */}
                {endpoint.body && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Request Body ({endpoint.bodyType})
                    </h4>
                    <pre className="bg-muted rounded p-3 font-mono text-sm overflow-x-auto">
                      {endpoint.body}
                    </pre>
                  </div>
                )}

                {/* Tags */}
                {endpoint.tags && endpoint.tags.length > 0 && (
                  <div className="flex gap-2">
                    {endpoint.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary/20 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}