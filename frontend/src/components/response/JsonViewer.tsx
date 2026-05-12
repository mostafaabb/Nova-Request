'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: any;
  initialExpanded?: boolean;
}

export function JsonViewer({ data, initialExpanded = true }: JsonViewerProps) {
  if (data === null) {
    return <span className="text-orange-500">null</span>;
  }

  if (typeof data === 'undefined') {
    return <span className="text-muted-foreground">undefined</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="text-purple-500">{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="text-blue-500">{data}</span>;
  }

  if (typeof data === 'string') {
    // Check if it's a URL
    if (data.match(/^https?:\/\//)) {
      return (
        <a href={data} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
          {`"${data}"`}
        </a>
      );
    }
    return <span className="text-green-500">{`"${data}"`}</span>;
  }

  if (Array.isArray(data)) {
    return <JsonArray data={data} initialExpanded={initialExpanded} />;
  }

  if (typeof data === 'object') {
    return <JsonObject data={data} initialExpanded={initialExpanded} />;
  }

  return <span>{String(data)}</span>;
}

function JsonObject({ data, initialExpanded }: { data: Record<string, any>; initialExpanded: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <span className="text-muted-foreground">{'{}'}</span>;
  }

  return (
    <div className="json-viewer">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center hover:text-primary"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-muted-foreground">{'{'}</span>
        {!expanded && (
          <span className="text-muted-foreground ml-1">
            {entries.length} {entries.length === 1 ? 'key' : 'keys'}
          </span>
        )}
        {!expanded && <span className="text-muted-foreground">{'}'}</span>}
      </button>
      
      {expanded && (
        <div className="ml-4 border-l border-border pl-2">
          {entries.map(([key, value], index) => (
            <div key={key}>
              <span className="text-primary">{`"${key}"`}</span>
              <span className="text-muted-foreground">: </span>
              <JsonViewer data={value} initialExpanded={false} />
              {index < entries.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
      )}
      {expanded && <span className="text-muted-foreground">{'}'}</span>}
    </div>
  );
}

function JsonArray({ data, initialExpanded }: { data: any[]; initialExpanded: boolean }) {
  const [expanded, setExpanded] = useState(initialExpanded);

  if (data.length === 0) {
    return <span className="text-muted-foreground">[]</span>;
  }

  return (
    <div className="json-viewer">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center hover:text-primary"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-muted-foreground">[</span>
        {!expanded && (
          <span className="text-muted-foreground ml-1">
            {data.length} {data.length === 1 ? 'item' : 'items'}
          </span>
        )}
        {!expanded && <span className="text-muted-foreground">]</span>}
      </button>
      
      {expanded && (
        <div className="ml-4 border-l border-border pl-2">
          {data.map((item, index) => (
            <div key={index}>
              <JsonViewer data={item} initialExpanded={false} />
              {index < data.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
      )}
      {expanded && <span className="text-muted-foreground">]</span>}
    </div>
  );
}