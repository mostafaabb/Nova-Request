'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookText,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCollectionStore } from '@/store/collectionStore';
import { useRequestStore } from '@/store/requestStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Collection, Endpoint } from '@/types';
import { collectionApi } from '@/lib/api';
import { cn, downloadJson, getMethodColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { CollectionFormDialog } from '@/components/collections/CollectionFormDialog';
import { ImportCollectionDialog } from '@/components/collections/ImportCollectionDialog';
import { ShareCollectionDialog } from '@/components/collections/ShareCollectionDialog';
import toast from 'react-hot-toast';

type ConfirmState =
  | { kind: 'collection'; id: string; name: string }
  | { kind: 'endpoint'; id: string; name: string }
  | null;

interface SidebarCollectionsProps {
  collapsed?: boolean;
  onExpandSidebar?: () => void;
  onNavigate?: () => void;
}

export function SidebarCollections({
  collapsed = false,
  onExpandSidebar,
  onNavigate,
}: SidebarCollectionsProps) {
  const router = useRouter();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const {
    collections,
    currentCollection,
    currentEndpoint,
    isLoading,
    fetchCollections,
    fetchCollection,
    selectEndpoint,
    clearSelection,
    deleteCollection,
    deleteEndpoint,
    duplicateEndpoint,
  } = useCollectionStore();
  const { tabs, setActiveTab, addTab } = useRequestStore();

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [shareCollection, setShareCollection] = useState<Collection | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadCollections = async () => {
    setError('');
    try {
      await fetchCollections();
    } catch {
      setError('Could not load collections.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!activeWorkspaceId) return;
    setInitialLoading(true);
    setExpanded(new Set());
    setSearch('');
    clearSelection();
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const toggleCollection = async (collection: Collection) => {
    const next = new Set(expanded);
    if (next.has(collection.id)) {
      next.delete(collection.id);
      setExpanded(next);
      return;
    }

    next.add(collection.id);
    setExpanded(next);

    if (!collection.endpoints) {
      setLoadingCollectionId(collection.id);
      try {
        await fetchCollection(collection.id);
      } catch {
        toast.error('Could not load requests in this collection');
      } finally {
        setLoadingCollectionId(null);
      }
    } else {
      useCollectionStore.setState({ currentCollection: collection });
    }
  };

  const handleSelectEndpoint = (endpoint: Endpoint) => {
    selectEndpoint(endpoint);
    const existingTab = tabs.find((tab) => tab.name === endpoint.name && tab.url === endpoint.url);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      addTab(endpoint);
    }
    router.push('/dashboard/request');
    onNavigate?.();
  };

  const handleExport = async (collection: Collection) => {
    try {
      const response = await collectionApi.export(collection.id);
      downloadJson(response.data, `${collection.name.replace(/\s+/g, '-').toLowerCase()}.json`);
      toast.success('Collection exported');
    } catch {
      toast.error('Could not export this collection');
    }
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setConfirmBusy(true);
    try {
      if (confirmState.kind === 'collection') {
        await deleteCollection(confirmState.id);
        setExpanded((previous) => {
          const next = new Set(previous);
          next.delete(confirmState.id);
          return next;
        });
        toast.success('Collection deleted');
      } else {
        await deleteEndpoint(confirmState.id);
        toast.success('Request deleted');
      }
      setConfirmState(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Delete failed');
    } finally {
      setConfirmBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return collections;

    return collections.filter((collection) => {
      if (collection.name.toLowerCase().includes(term)) return true;
      return (collection.endpoints || []).some(
        (endpoint) =>
          endpoint.name.toLowerCase().includes(term) ||
          endpoint.url.toLowerCase().includes(term) ||
          endpoint.method.toLowerCase().includes(term)
      );
    });
  }, [collections, search]);

  const totalEndpoints = collections.reduce(
    (total, collection) =>
      total + (collection.endpoints?.length ?? collection._count?.endpoints ?? 0),
    0
  );

  if (collapsed) {
    return (
      <div className="px-2 py-2">
        <button
          type="button"
          onClick={onExpandSidebar}
          className="flex h-9 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
          title="Show collections"
        >
          <span className="relative">
            <Folder className="h-4 w-4" aria-hidden />
            {collections.length > 0 ? (
              <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                {collections.length}
              </span>
            ) : null}
          </span>
          <span className="sr-only">Show collections</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between px-3 pb-1 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Collections
          </span>
          {collections.length > 0 ? (
            <span className="text-3xs text-muted-foreground/70">{totalEndpoints}</span>
          ) : null}
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setEditingCollection(null);
              setFormOpen(true);
            }}
            aria-label="New collection"
            title="New collection"
          >
            <FolderPlus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setImportOpen(true)}
            aria-label="Import collection"
            title="Import collection"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="shrink-0 px-3 pb-2 pt-1">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter collections"
            className="h-8 bg-surface-2/40 pl-8 pr-7 text-xs"
            aria-label="Filter collections"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {initialLoading && isLoading ? (
          <div className="space-y-1.5 px-1 pt-1" aria-label="Loading collections">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex h-8 items-center gap-2 px-2">
                <span className="h-3.5 w-3.5 animate-pulse rounded bg-surface-3" />
                <span className="h-2.5 flex-1 animate-pulse rounded bg-surface-3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mx-1 mt-2 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              {error}
            </p>
            <Button variant="ghost" size="xs" className="mt-2" onClick={loadCollections}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-1 mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center">
            <p className="text-xs font-medium text-foreground">
              {search ? 'No matches' : 'No collections yet'}
            </p>
            <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
              {search
                ? 'Try a different name, method, or URL.'
                : 'Create a collection to keep requests organized.'}
            </p>
            {!search ? (
              <Button
                variant="secondary"
                size="xs"
                className="mt-3"
                onClick={() => {
                  setEditingCollection(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-3 w-3" aria-hidden />
                New collection
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((collection) => {
              const searchTerm = search.trim().toLowerCase();
              const endpoints = collection.endpoints || [];
              const hasEndpointMatch =
                Boolean(searchTerm) &&
                endpoints.some(
                  (endpoint) =>
                    endpoint.name.toLowerCase().includes(searchTerm) ||
                    endpoint.url.toLowerCase().includes(searchTerm) ||
                    endpoint.method.toLowerCase().includes(searchTerm)
                );
              const isExpanded = expanded.has(collection.id) || hasEndpointMatch;
              const endpointCount =
                endpoints.length || collection._count?.endpoints || 0;
              const isActive = currentCollection?.id === collection.id;

              return (
                <div key={collection.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-1 rounded-md pr-1 transition-colors',
                      isActive ? 'bg-accent/70' : 'hover:bg-surface-2'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCollection(collection)}
                      className="flex h-8 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                      aria-label={isExpanded ? 'Collapse collection' : 'Expand collection'}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCollection(collection)}
                      className="flex min-h-8 min-w-0 flex-1 items-center gap-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      {isExpanded ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                      ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-xs',
                          isActive ? 'font-medium text-foreground' : 'font-medium'
                        )}
                      >
                        {collection.name}
                      </span>
                      <span className="shrink-0 text-3xs tabular-nums text-muted-foreground/70">
                        {endpointCount}
                      </span>
                    </button>

                    <Dropdown>
                      <DropdownTrigger asChild>
                        <button
                          type="button"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-60 transition-opacity hover:bg-surface-3 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:opacity-0 md:group-hover:opacity-100"
                          aria-label={`Actions for ${collection.name}`}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </DropdownTrigger>
                      <DropdownContent align="start" className="w-52">
                        <DropdownItem
                          onSelect={() => {
                            setEditingCollection(collection);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Rename collection
                        </DropdownItem>
                        <DropdownItem
                          onSelect={() => {
                            setShareCollection(collection);
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5" aria-hidden />
                          Share collection
                        </DropdownItem>
                        <DropdownItem onSelect={() => router.push(`/docs/${collection.id}`)}>
                          <BookText className="h-3.5 w-3.5" aria-hidden />
                          View documentation
                        </DropdownItem>
                        <DropdownItem onSelect={() => handleExport(collection)}>
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          Export JSON
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem
                          destructive
                          onSelect={() =>
                            setConfirmState({
                              kind: 'collection',
                              id: collection.id,
                              name: collection.name,
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete collection
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>

                  {isExpanded ? (
                    <div className="ml-[1.375rem] mt-0.5 space-y-px border-l border-border pl-2">
                      {loadingCollectionId === collection.id ? (
                        <p className="px-2 py-2 text-2xs text-muted-foreground">Loading requests…</p>
                      ) : endpoints.length === 0 ? (
                        <p className="px-2 py-2 text-2xs leading-relaxed text-muted-foreground">
                          {endpointCount === 0
                            ? 'No requests yet.'
                            : 'Expand again to reload requests.'}
                        </p>
                      ) : (
                        endpoints
                          .filter((endpoint) =>
                            searchTerm
                              ? endpoint.name.toLowerCase().includes(searchTerm) ||
                                endpoint.url.toLowerCase().includes(searchTerm) ||
                                endpoint.method.toLowerCase().includes(searchTerm) ||
                                collection.name.toLowerCase().includes(searchTerm)
                              : true
                          )
                          .map((endpoint) => (
                            <div
                              key={endpoint.id}
                              className={cn(
                                'group flex items-center gap-1 rounded-md pr-0.5 transition-colors',
                                currentEndpoint?.id === endpoint.id
                                  ? 'bg-accent text-accent-foreground'
                                  : 'hover:bg-surface-2'
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectEndpoint(endpoint)}
                                className="flex min-h-8 min-w-0 flex-1 items-center gap-2 py-1 pl-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                              >
                                <span
                                  className={cn(
                                    'w-11 shrink-0 font-mono text-3xs font-semibold tracking-tight',
                                    getMethodColor(endpoint.method)
                                  )}
                                >
                                  {endpoint.method}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs">{endpoint.name}</span>
                              </button>
                              <Dropdown>
                                <DropdownTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-60 transition-opacity hover:bg-surface-3 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:opacity-0 md:group-hover:opacity-100"
                                    aria-label={`Actions for ${endpoint.name}`}
                                  >
                                    <MoreHorizontal className="h-3 w-3" aria-hidden />
                                  </button>
                                </DropdownTrigger>
                                <DropdownContent align="start" className="w-44">
                                  <DropdownItem
                                    onSelect={async () => {
                                      try {
                                        await duplicateEndpoint(endpoint.id);
                                        toast.success('Request duplicated');
                                      } catch {
                                        toast.error('Could not duplicate request');
                                      }
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" aria-hidden />
                                    Duplicate
                                  </DropdownItem>
                                  <DropdownSeparator />
                                  <DropdownItem
                                    destructive
                                    onSelect={() =>
                                      setConfirmState({
                                        kind: 'endpoint',
                                        id: endpoint.id,
                                        name: endpoint.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    Delete request
                                  </DropdownItem>
                                </DropdownContent>
                              </Dropdown>
                            </div>
                          ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CollectionFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCollection(null);
        }}
        collection={editingCollection}
      />
      <ImportCollectionDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ShareCollectionDialog
        open={Boolean(shareCollection)}
        onClose={() => setShareCollection(null)}
        collection={shareCollection}
      />
      <ConfirmDialog
        open={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirm}
        title={
          confirmState?.kind === 'collection'
            ? `Delete “${confirmState.name}”?`
            : `Delete “${confirmState?.name || 'request'}”?`
        }
        description={
          confirmState?.kind === 'collection'
            ? 'The collection and every saved request inside it will be permanently removed from this workspace.'
            : 'This saved request will be permanently removed. Open request tabs are not affected.'
        }
        confirmLabel="Delete"
        loading={confirmBusy}
      />
    </div>
  );
}
