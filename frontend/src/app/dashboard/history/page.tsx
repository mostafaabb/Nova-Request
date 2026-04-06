'use client';

import { useEffect, useState } from 'react';
import { historyApi } from '@/lib/api';
import { RequestHistory } from '@/types';
import { cn, getMethodColor, getStatusColor, formatResponseTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Trash2, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await historyApi.getAll({ limit: 100 });
      setHistory(response.data.history);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all request history?')) return;
    
    try {
      await historyApi.clearAll();
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await historyApi.delete(id);
      setHistory(h => h.filter(item => item.id !== id));
      toast.success('Entry deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Request History</h1>
        </div>
        {history.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto p-4">
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No request history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-lg p-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={cn('font-mono font-bold text-sm w-16', getMethodColor(item.method))}>
                    {item.method}
                  </span>
                  <span className="flex-1 font-mono text-sm truncate">{item.url}</span>
                  {item.responseStatus && (
                    <span className={cn('font-mono text-sm', getStatusColor(item.responseStatus))}>
                      {item.responseStatus}
                    </span>
                  )}
                  {item.responseTime && (
                    <span className="text-sm text-muted-foreground">
                      {formatResponseTime(item.responseTime)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}