/**
 * Live API Tester - Frontend Components Generator (Part 2)
 * 
 * Run this AFTER generate-project.js:
 *   node generate-frontend.js
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

const files = {
  // Request Builder Component
  'frontend/src/components/request/RequestBuilder.tsx': `'use client';

import { useRequestStore } from '@/store/requestStore';
import { useCollectionStore } from '@/store/collectionStore';
import { HttpMethod } from '@/types';
import { cn, getMethodColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { HeadersEditor } from './HeadersEditor';
import { ParamsEditor } from './ParamsEditor';
import { BodyEditor } from './BodyEditor';
import { Send, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function RequestBuilder() {
  const {
    method, url, headers, queryParams, body, bodyType, isLoading,
    setMethod, setUrl, sendRequest,
  } = useRequestStore();
  
  const { currentCollection, currentEndpoint, createEndpoint, updateEndpoint } = useCollectionStore();
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  const handleSend = () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    sendRequest(currentEndpoint?.id);
  };

  const handleSave = async () => {
    if (!currentCollection) {
      toast.error('Please select a collection first');
      return;
    }

    if (!saveName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const endpointData = {
        name: saveName,
        description: saveDescription,
        method,
        url,
        headers: headers.filter(h => h.key),
        queryParams: queryParams.filter(p => p.key),
        body,
        bodyType,
      };

      if (currentEndpoint) {
        await updateEndpoint(currentEndpoint.id, endpointData);
        toast.success('Endpoint updated');
      } else {
        await createEndpoint(currentCollection.id, endpointData);
        toast.success('Endpoint saved');
      }

      setShowSaveModal(false);
      setSaveName('');
      setSaveDescription('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save');
    }
  };

  const openSaveModal = () => {
    if (currentEndpoint) {
      setSaveName(currentEndpoint.name);
      setSaveDescription(currentEndpoint.description || '');
    }
    setShowSaveModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex gap-2 p-4 border-b border-border">
        <Select 
          value={method} 
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={cn('w-28 font-semibold', getMethodColor(method))}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>

        <Input
          placeholder="Enter URL (e.g., https://api.example.com/users)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 font-mono text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />

        <Button onClick={handleSend} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send
        </Button>

        <Button variant="outline" onClick={openSaveModal} disabled={!currentCollection}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Request Config Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="params" className="h-full flex flex-col">
          <div className="border-b border-border px-4">
            <TabsList>
              <TabsTrigger value="params">
                Query Params
                {queryParams.filter(p => p.key).length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">
                    {queryParams.filter(p => p.key).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers">
                Headers
                {headers.filter(h => h.key).length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">
                    {headers.filter(h => h.key).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="params" className="p-4 h-full">
              <ParamsEditor />
            </TabsContent>
            <TabsContent value="headers" className="p-4 h-full">
              <HeadersEditor />
            </TabsContent>
            <TabsContent value="body" className="p-4 h-full">
              <BodyEditor />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={currentEndpoint ? 'Update Endpoint' : 'Save Endpoint'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              placeholder="Endpoint name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <Input
              placeholder="What does this endpoint do?"
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {currentEndpoint ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}`,

  // Headers Editor Component
  'frontend/src/components/request/HeadersEditor.tsx': `'use client';

import { useRequestStore } from '@/store/requestStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export function HeadersEditor() {
  const { headers, addHeader, removeHeader, updateHeader } = useRequestStore();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-sm text-muted-foreground font-medium">
        <div className="w-8"></div>
        <div>Key</div>
        <div>Value</div>
        <div className="w-8"></div>
      </div>

      {headers.map((header, index) => (
        <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <Input
            placeholder="Header name"
            value={header.key}
            onChange={(e) => updateHeader(index, 'key', e.target.value)}
            className="font-mono text-sm"
          />
          <Input
            placeholder="Value"
            value={header.value}
            onChange={(e) => updateHeader(index, 'value', e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeHeader(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={addHeader} className="mt-2">
        <Plus className="h-4 w-4 mr-1" />
        Add Header
      </Button>
    </div>
  );
}`,

  // Params Editor Component
  'frontend/src/components/request/ParamsEditor.tsx': `'use client';

import { useRequestStore } from '@/store/requestStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export function ParamsEditor() {
  const { queryParams, addQueryParam, removeQueryParam, updateQueryParam } = useRequestStore();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-sm text-muted-foreground font-medium">
        <div className="w-8"></div>
        <div>Key</div>
        <div>Value</div>
        <div className="w-8"></div>
      </div>

      {queryParams.map((param, index) => (
        <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
          <input
            type="checkbox"
            checked={param.enabled}
            onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded border-input"
          />
          <Input
            placeholder="Parameter name"
            value={param.key}
            onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
            className="font-mono text-sm"
          />
          <Input
            placeholder="Value"
            value={param.value}
            onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeQueryParam(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={addQueryParam} className="mt-2">
        <Plus className="h-4 w-4 mr-1" />
        Add Parameter
      </Button>
    </div>
  );
}`,

  // Body Editor Component
  'frontend/src/components/request/BodyEditor.tsx': `'use client';

import { useRequestStore } from '@/store/requestStore';
import { BodyType } from '@/types';
import { cn } from '@/lib/utils';

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'raw', label: 'Raw' },
];

export function BodyEditor() {
  const { body, bodyType, method, setBody, setBodyType } = useRequestStore();

  if (method === 'GET') {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        GET requests cannot have a body
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Body type selector */}
      <div className="flex gap-2">
        {BODY_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setBodyType(type.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              bodyType === type.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Body editor */}
      {bodyType !== 'none' && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            bodyType === 'json'
              ? '{\n  "key": "value"\n}'
              : bodyType === 'form-data'
              ? 'key1=value1&key2=value2'
              : 'Enter raw body content'
          }
          className={cn(
            'w-full h-64 p-4 rounded-md border border-input bg-background',
            'font-mono text-sm resize-none',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        />
      )}
    </div>
  );
}`,

  // Response Viewer Component
  'frontend/src/components/response/ResponseViewer.tsx': `'use client';

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
}`,

  // JSON Viewer Component
  'frontend/src/components/response/JsonViewer.tsx': `'use client';

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
    if (data.match(/^https?:\\/\\//)) {
      return (
        <a href={data} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
          "{data}"
        </a>
      );
    }
    return <span className="text-green-500">"{data}"</span>;
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
              <span className="text-primary">"{key}"</span>
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
}`,

  // Sidebar Component
  'frontend/src/components/layout/Sidebar.tsx': `'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCollectionStore } from '@/store/collectionStore';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { cn, getMethodColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Share2,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collectionApi } from '@/lib/api';
import { downloadJson } from '@/lib/utils';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const {
    collections,
    currentCollection,
    currentEndpoint,
    fetchCollections,
    fetchCollection,
    createCollection,
    deleteCollection,
    selectEndpoint,
    deleteEndpoint,
    duplicateEndpoint,
    generateShareLink,
  } = useCollectionStore();
  const { loadEndpoint } = useRequestStore();

  const [search, setSearch] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const toggleCollection = async (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
      await fetchCollection(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      await createCollection(newCollectionName);
      setNewCollectionName('');
      setShowNewCollectionModal(false);
      toast.success('Collection created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create collection');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection and all its endpoints?')) return;
    
    try {
      await deleteCollection(id);
      toast.success('Collection deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleSelectEndpoint = (endpoint: any) => {
    selectEndpoint(endpoint);
    loadEndpoint(endpoint);
  };

  const handleShareCollection = async (id: string) => {
    try {
      const shareUrl = await generateShareLink(id);
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate link');
    }
  };

  const handleExportCollection = async (id: string) => {
    try {
      const response = await collectionApi.export(id);
      downloadJson(response.data, \`collection-\${id}.json\`);
      toast.success('Collection exported');
    } catch (error: any) {
      toast.error('Failed to export');
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      await collectionApi.import(data);
      await fetchCollections();
      setShowImportModal(false);
      setImportData('');
      toast.success('Collection imported');
    } catch (error: any) {
      toast.error('Invalid import data');
    }
  };

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 h-full border-r border-border bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold">API Tester</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Search & Actions */}
      <div className="p-2 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setShowNewCollectionModal(true)}
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            New
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-auto p-2">
        {filteredCollections.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No collections yet
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCollections.map((collection) => {
              const isExpanded = expandedCollections.has(collection.id);
              const isActive = currentCollection?.id === collection.id;

              return (
                <div key={collection.id}>
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group',
                      isActive ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                  >
                    <button onClick={() => toggleCollection(collection.id)}>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className="flex-1 text-sm truncate"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {collection.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {collection._count?.endpoints || 0}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareCollection(collection.id);
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportCollection(collection.id);
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                        className="p-1 hover:bg-background rounded text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Endpoints */}
                  {isExpanded && currentCollection?.id === collection.id && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {currentCollection.endpoints?.map((endpoint) => (
                        <div
                          key={endpoint.id}
                          onClick={() => handleSelectEndpoint(endpoint)}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-sm group',
                            currentEndpoint?.id === endpoint.id
                              ? 'bg-primary/20'
                              : 'hover:bg-accent/50'
                          )}
                        >
                          <span className={cn('text-xs font-mono font-bold w-12', getMethodColor(endpoint.method))}>
                            {endpoint.method}
                          </span>
                          <span className="flex-1 truncate">{endpoint.name}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateEndpoint(endpoint.id);
                                toast.success('Endpoint duplicated');
                              }}
                              className="p-1 hover:bg-background rounded"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEndpoint(endpoint.id);
                                toast.success('Endpoint deleted');
                              }}
                              className="p-1 hover:bg-background rounded text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full" onClick={logout}>
          Sign Out
        </Button>
      </div>

      {/* New Collection Modal */}
      <Modal
        isOpen={showNewCollectionModal}
        onClose={() => setShowNewCollectionModal(false)}
        title="New Collection"
      >
        <div className="space-y-4">
          <Input
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNewCollectionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Collection"
      >
        <div className="space-y-4">
          <textarea
            placeholder="Paste exported JSON here..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="w-full h-48 p-2 rounded-md border border-input bg-background font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}`,

  // Header Component
  'frontend/src/components/layout/Header.tsx': `'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Moon, Sun, History, FileText } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-bold text-lg">
          Live API Tester
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/dashboard/history">
          <Button variant="ghost" size="icon">
            <History className="h-5 w-5" />
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}`,

  // Dashboard Layout
  'frontend/src/app/dashboard/layout.tsx': `'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}`,

  // Dashboard Page
  'frontend/src/app/dashboard/page.tsx': `'use client';

import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ResponseViewer } from '@/components/response/ResponseViewer';

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Request Builder */}
      <div className="flex-1 min-h-0 border-b lg:border-b-0 lg:border-r border-border">
        <RequestBuilder />
      </div>
      
      {/* Response Viewer */}
      <div className="flex-1 min-h-0 overflow-auto">
        <ResponseViewer />
      </div>
    </div>
  );
}`,

  // Login Page
  'frontend/src/app/auth/login/page.tsx': `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Live API Tester</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}`,

  // Register Page
  'frontend/src/app/auth/register/page.tsx': `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(email, password, name);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Live API Tester</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}`,

  // Share Page
  'frontend/src/app/share/[shareId]/page.tsx': `'use client';

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
}`,

  // History Page
  'frontend/src/app/dashboard/history/page.tsx': `'use client';

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
}`,

  // Docs Page
  'frontend/src/app/docs/[collectionId]/page.tsx': `'use client';

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
}`,

  // Next.js env.d.ts
  'frontend/next-env.d.ts': `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`,
};

// Create all files
function createFile(relativePath, content) {
  const fullPath = path.join(BASE_DIR, relativePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ Created: ' + relativePath);
}

// Main execution
console.log('🎨 Generating Frontend Components (Part 2)...\n');

Object.entries(files).forEach(([filePath, content]) => {
  createFile(filePath, content);
});

console.log('\n✅ Generated ' + Object.keys(files).length + ' files!');
console.log('\n✨ Frontend components created successfully!');
