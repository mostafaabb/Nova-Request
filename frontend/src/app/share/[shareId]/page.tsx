'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { shareApi } from '@/lib/api';
import { Collection } from '@/types';
import { cn, getMethodColor } from '@/lib/utils';
import { Folder, Globe, User, Clock } from 'lucide-react';

export default function SharePage() {
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await shareApi.getCollection(params.shareId as string);
        setCollection(response.data.collection);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Collection not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [params.shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
          <p className="text-muted-foreground">{error || 'This collection may have been removed or made private.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Folder className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            <span className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
              <Globe className="h-3 w-3" />
              Public
            </span>
          </div>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {(collection as any).author}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Updated {new Date(collection.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      {/* Endpoints */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">
          Endpoints ({collection.endpoints?.length || 0})
        </h2>
        
        <div className="space-y-4">
          {collection.endpoints?.map((endpoint) => (
            <div
              key={endpoint.id}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={cn(
                  'px-2 py-0.5 rounded text-sm font-mono font-bold',
                  getMethodColor(endpoint.method)
                )}>
                  {endpoint.method}
                </span>
                <span className="font-medium">{endpoint.name}</span>
              </div>
              
              <code className="block text-sm bg-muted px-3 py-2 rounded font-mono mb-2">
                {endpoint.url}
              </code>
              
              {endpoint.description && (
                <p className="text-sm text-muted-foreground">
                  {endpoint.description}
                </p>
              )}

              {endpoint.headers && endpoint.headers.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">Headers</h4>
                  <div className="bg-muted rounded p-2 text-sm font-mono">
                    {(endpoint.headers as any[]).filter(h => h.key).map((h, i) => (
                      <div key={i}>
                        <span className="text-primary">{h.key}</span>: {h.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {endpoint.body && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">Body</h4>
                  <pre className="bg-muted rounded p-2 text-sm font-mono overflow-x-auto">
                    {endpoint.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}