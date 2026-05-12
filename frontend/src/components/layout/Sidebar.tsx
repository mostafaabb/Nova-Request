'use client';

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
  const { tabs, setActiveTab, addTab } = useRequestStore();

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
    // Find if a tab is already open for this endpoint
    const existingTab = tabs.find(t => t.name === endpoint.name && t.url === endpoint.url);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      addTab(endpoint);
    }
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
      downloadJson(response.data, `collection-${id}.json`);
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
    <aside className="w-full h-full min-w-0 rounded-lg border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-muted/15">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Collections</h1>
            <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email}</p>
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary shrink-0">
            API
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="px-4 py-3 border-b border-border/60 space-y-3 bg-background/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/30 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 font-semibold"
            onClick={() => setShowNewCollectionModal(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-semibold"
            onClick={() => setShowImportModal(true)}
            title="Import collection"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        {filteredCollections.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm rounded-lg border border-dashed border-border/50 bg-muted/10">
            No collections yet
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredCollections.map((collection) => {
              const isExpanded = expandedCollections.has(collection.id);
              const isActive = currentCollection?.id === collection.id;

              return (
                <div key={collection.id}>
                  <div
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer group transition-smooth',
                      isActive ? 'bg-primary/15 text-primary shadow-sm border border-primary/20' : 'hover:bg-muted/40 border border-transparent'
                    )}
                  >
                    <button onClick={() => toggleCollection(collection.id)} className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className="flex-1 text-sm font-semibold truncate"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {collection.name}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground rounded-full bg-muted/50 px-2 py-0.5 shrink-0">
                      {collection._count?.endpoints || 0}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareCollection(collection.id);
                        }}
                        className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-smooth"
                        title="Share"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportCollection(collection.id);
                        }}
                        className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-smooth"
                        title="Export"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                        className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-smooth"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Endpoints */}
                  {isExpanded && currentCollection?.id === collection.id && (
                    <div className="ml-4 mt-2 space-y-1">
                      {currentCollection.endpoints?.map((endpoint) => (
                        <div
                          key={endpoint.id}
                          onClick={() => handleSelectEndpoint(endpoint)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm group border transition-smooth',
                            currentEndpoint?.id === endpoint.id
                              ? 'bg-primary/15 border-primary/20 shadow-sm'
                              : 'hover:bg-muted/40 border-transparent hover:border-border/30'
                          )}
                        >
                          <span className={cn('text-xs font-mono font-bold w-11', getMethodColor(endpoint.method))}>
                            {endpoint.method}
                          </span>
                          <span className="flex-1 truncate text-xs font-medium">{endpoint.name}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateEndpoint(endpoint.id);
                                toast.success('Endpoint duplicated');
                              }}
                              className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-smooth"
                              title="Duplicate"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEndpoint(endpoint.id);
                                toast.success('Endpoint deleted');
                              }}
                              className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-smooth"
                              title="Delete"
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
      <div className="px-4 py-3 border-t border-border/60 bg-muted/15">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={logout}>
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
    </aside>
  );
}
