'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Code2,
  FileText,
  FlaskConical,
  Folder,
  Keyboard,
  Loader2,
  Plus,
  Save,
  Send,
  Shield,
  SlidersHorizontal,
  List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRequestStore } from '@/store/requestStore';
import { useCollectionStore } from '@/store/collectionStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import type { HttpMethod } from '@/types';
import { cn, getApiErrorMessage, getMethodColor, getRequestLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { HeadersEditor } from './HeadersEditor';
import { ParamsEditor } from './ParamsEditor';
import { BodyEditor } from './BodyEditor';
import { AuthEditor } from './AuthEditor';
import { RequestTabs } from './RequestTabs';
import { ScriptEditor } from './ScriptEditor';
import { TestsTab } from './TestsTab';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const tabTriggerClass =
  'group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 sm:px-3';

function CountBadge({ value }: { value: number }) {
  return (
    <span className="rounded bg-surface-3 px-1 text-3xs font-medium tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

export function RequestBuilder() {
  const {
    getActiveTab,
    updateActiveTab,
    sendRequest,
    addTab,
    tabs,
    markTabSaved,
  } = useRequestStore();
  const {
    collections,
    currentCollection,
    currentEndpoint,
    createEndpoint,
    updateEndpoint,
    fetchCollection,
    selectEndpoint,
  } = useCollectionStore();
  const activeEnvironmentId = useEnvironmentStore((state) => state.activeEnvironmentId);
  const environments = useEnvironmentStore((state) => state.environments);

  const activeTab = getActiveTab();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCollectionId, setSaveCollectionId] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs.length, addTab]);

  const activeEnvironment = environments.find(
    (environment) => environment.id === activeEnvironmentId
  );

  const existingEndpointId = activeTab?.endpointId;
  const targetCollectionId = useMemo(() => {
    if (!activeTab) return '';
    return activeTab.endpointId
      ? activeTab.collectionId || currentCollection?.id || ''
      : saveCollectionId || currentCollection?.id || '';
  }, [activeTab, currentCollection?.id, saveCollectionId]);

  const targetCollection = collections.find((collection) => collection.id === targetCollectionId);
  const saveModalTitle = existingEndpointId ? 'Update saved request' : 'Save request';

  const sendNow = useCallback(() => {
    const tab = useRequestStore.getState().getActiveTab();
    if (!tab) return;
    if (!tab.url.trim()) {
      toast.error('Enter a URL before sending');
      return;
    }
    sendRequest(tab.endpointId);
  }, [sendRequest]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        if (showSaveModal) return;
        event.preventDefault();
        sendNow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSaveModal, sendNow]);

  if (!activeTab) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background px-6 text-center">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-foreground">No request tab is open</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Open a new tab to start composing a request.
        </p>
        <Button variant="primary" className="mt-4" onClick={() => addTab()}>
          <Plus className="h-4 w-4" aria-hidden />
          New request
        </Button>
      </div>
    );
  }

  const qpCount = (activeTab.queryParams || []).filter((param) => param.key.trim()).length;
  const headerCount = (activeTab.headers || []).filter((header) => header.key.trim()).length;
  const testCount = (activeTab.tests || []).length;
  const hasAuth = activeTab.auth.type !== 'none';
  const hasBody =
    activeTab.bodyType !== 'none' ||
    (activeTab.formFields || []).some((field) => field.key.trim());

  const openSaveModal = () => {
    setSaveName(
      activeTab.endpointId
        ? activeTab.name
        : activeTab.name && activeTab.name !== 'New Request'
          ? activeTab.name
          : ''
    );
    setSaveDescription(activeTab.endpointDescription || '');
    setSaveCollectionId(
      activeTab.collectionId || currentCollection?.id || collections[0]?.id || ''
    );
    setSaveError('');
    setShowSaveModal(true);
  };

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (saveBusy) return;

    const trimmedName = saveName.trim();
    if (!trimmedName) {
      setSaveError('Give this request a name.');
      return;
    }

    if (!existingEndpointId && !targetCollectionId) {
      setSaveError('Choose a collection for this request.');
      return;
    }

    const endpointData = {
      name: trimmedName,
      description: saveDescription.trim(),
      method: activeTab.method,
      url: activeTab.url,
      headers: activeTab.headers.filter((header) => header.key.trim()),
      queryParams: activeTab.queryParams.filter((param) => param.key.trim()),
      body: activeTab.body,
      bodyType: activeTab.bodyType,
      auth: activeTab.auth,
      formFields: activeTab.formFields.filter((field) => field.key.trim()),
      preRequestScript: activeTab.preRequestScript || null,
      postRequestScript: activeTab.postRequestScript || null,
      tests: activeTab.tests,
    };

    setSaveBusy(true);
    setSaveError('');
    try {
      if (existingEndpointId) {
        await updateEndpoint(existingEndpointId, endpointData);
        markTabSaved({
          name: trimmedName,
          endpointDescription: saveDescription.trim(),
        });
        toast.success('Request updated');
      } else {
        const created = await createEndpoint(targetCollectionId, endpointData);
        markTabSaved({
          name: trimmedName,
          endpointId: created.id,
          collectionId: targetCollectionId,
          endpointDescription: saveDescription.trim(),
        });
        selectEndpoint(created);
        fetchCollection(targetCollectionId).catch(() => {});
        toast.success('Request saved to collection');
      }
      setShowSaveModal(false);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Could not save this request.');
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="shrink-0">
        <RequestTabs />
      </div>

      <div className="shrink-0 border-b border-border bg-surface px-3 py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Select
            value={activeTab.method}
            onChange={(event) => updateActiveTab({ method: event.target.value as HttpMethod })}
            className={cn(
              'h-9 w-[5.75rem] shrink-0 bg-surface-2/60 font-mono text-xs font-semibold sm:w-24',
              getMethodColor(activeTab.method)
            )}
            aria-label="HTTP method"
          >
            {METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>

          <Input
            placeholder="https://api.example.com/v1/resource or {{base_url}}/users"
            value={activeTab.url}
            onChange={(event) => updateActiveTab({ url: event.target.value })}
            className="h-9 min-w-0 flex-1 bg-surface-2/60 font-mono text-xs focus:bg-surface"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                sendNow();
              }
            }}
            aria-label="Request URL"
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="send"
          />

          <Button
            variant="primary"
            onClick={sendNow}
            disabled={activeTab.isLoading}
            className="h-9 shrink-0 px-2.5 sm:px-4"
            aria-label={activeTab.isLoading ? 'Sending request' : 'Send request'}
          >
            {activeTab.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">{activeTab.isLoading ? 'Sending' : 'Send'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={openSaveModal}
            className="h-9 w-9 shrink-0 px-0 sm:w-auto sm:px-3"
            aria-label="Save request"
            title="Save request"
          >
            <Save className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3 text-2xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                activeTab.isDirty ? 'bg-primary' : 'bg-border-strong'
              )}
              aria-hidden
            />
            <span className="truncate">
              {activeTab.isDirty
                ? 'Unsaved changes'
                : activeTab.endpointId
                  ? `Saved${targetCollection ? ` in ${targetCollection.name}` : ''}`
                  : 'Not saved to a collection'}
            </span>
            {activeEnvironment ? (
              <>
                <span className="mx-0.5 text-border-strong" aria-hidden>
                  ·
                </span>
                <span className="hidden truncate sm:inline">{activeEnvironment.name}</span>
              </>
            ) : null}
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 md:flex">
            <Keyboard className="h-3 w-3" aria-hidden />
            <kbd className="kbd h-4 min-w-4 px-1 text-[9px]">Ctrl</kbd>
            <span aria-hidden>/</span>
            <kbd className="kbd h-4 min-w-4 px-1 text-[9px]">⌘</kbd>
            <span>+ Enter to send</span>
          </span>
        </div>
      </div>

      <Tabs defaultValue="params" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border bg-background px-2">
          <TabsList className="flex h-10 w-full items-stretch justify-start gap-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 no-scrollbar">
            <TabsTrigger value="params" className={tabTriggerClass}>
              <SlidersHorizontal className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
              Params
              {qpCount > 0 ? <CountBadge value={qpCount} /> : null}
            </TabsTrigger>
            <TabsTrigger value="auth" className={tabTriggerClass}>
              <Shield className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
              Auth
              {hasAuth ? <span className="h-1 w-1 rounded-full bg-primary" aria-hidden /> : null}
            </TabsTrigger>
            <TabsTrigger value="headers" className={tabTriggerClass}>
              <List className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
              Headers
              {headerCount > 0 ? <CountBadge value={headerCount} /> : null}
            </TabsTrigger>
            <TabsTrigger value="body" className={tabTriggerClass}>
              <FileText className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
              Body
              {hasBody ? <span className="h-1 w-1 rounded-full bg-primary" aria-hidden /> : null}
            </TabsTrigger>
            <TabsTrigger value="scripts" className={tabTriggerClass}>
              <Code2 className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
              Scripts
            </TabsTrigger>
            <TabsTrigger value="tests" className={tabTriggerClass}>
              <FlaskConical className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
              Tests
              {testCount > 0 ? <CountBadge value={testCount} /> : null}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="params" className="m-0 mt-0 p-3 focus-visible:outline-none sm:p-4">
            <ParamsEditor variant="query" />
          </TabsContent>

          <TabsContent value="auth" className="m-0 mt-0 p-3 focus-visible:outline-none sm:p-4">
            <AuthEditor />
          </TabsContent>

          <TabsContent value="headers" className="m-0 mt-0 p-3 focus-visible:outline-none sm:p-4">
            <HeadersEditor />
          </TabsContent>

          <TabsContent value="body" className="m-0 mt-0 p-3 focus-visible:outline-none sm:p-4">
            <BodyEditor />
          </TabsContent>

          <TabsContent value="scripts" className="m-0 mt-0 p-3 focus-visible:outline-none sm:p-4">
            <Tabs defaultValue="pre" className="flex flex-col gap-3">
              <TabsList className="h-8 w-fit rounded-md border border-border bg-surface-2/45 p-0.5">
                <TabsTrigger value="pre" className="h-6 px-2.5 text-2xs">
                  Pre-request
                </TabsTrigger>
                <TabsTrigger value="post" className="h-6 px-2.5 text-2xs">
                  Post-response
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pre" className="m-0 mt-0 focus-visible:outline-none">
                <ScriptEditor
                  value={activeTab.preRequestScript}
                  onChange={(value) => updateActiveTab({ preRequestScript: value })}
                  scriptType="pre"
                />
              </TabsContent>
              <TabsContent value="post" className="m-0 mt-0 focus-visible:outline-none">
                <ScriptEditor
                  value={activeTab.postRequestScript}
                  onChange={(value) => updateActiveTab({ postRequestScript: value })}
                  scriptType="post"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="tests" className="m-0 mt-0 p-3 focus-visible:outline-none sm:p-4">
            <TestsTab
              tests={activeTab.tests}
              onChange={(tests) => updateActiveTab({ tests })}
              testResults={activeTab.response?.tests}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          if (saveBusy) return;
          setShowSaveModal(false);
        }}
        title={saveModalTitle}
        description={
          existingEndpointId
            ? 'Update the saved request with the current method, URL, and configuration.'
            : 'Save this request to a collection so you can reopen it later.'
        }
        className="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="save-request-name" className="field-label">
              Name
            </label>
            <Input
              id="save-request-name"
              placeholder={getRequestLabel(activeTab.url) === 'Untitled request' ? 'List users' : getRequestLabel(activeTab.url)}
              value={saveName}
              onChange={(event) => {
                setSaveName(event.target.value);
                if (saveError) setSaveError('');
              }}
              autoFocus
              aria-invalid={Boolean(saveError && !saveName.trim())}
            />
          </div>

          <div>
            <label htmlFor="save-request-description" className="field-label">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="save-request-description"
              placeholder="What does this request do?"
              value={saveDescription}
              onChange={(event) => setSaveDescription(event.target.value)}
            />
          </div>

          <div>
            {existingEndpointId ? (
              <>
                <span className="field-label">Collection</span>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2/45 px-3 text-xs text-muted-foreground">
                  <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {targetCollection?.name || currentCollection?.name || 'Saved collection'}
                  </span>
                </div>
                <p className="field-hint">Saved requests stay in their original collection.</p>
              </>
            ) : collections.length > 0 ? (
              <>
                <label htmlFor="save-request-collection" className="field-label">
                  Collection
                </label>
                <Select
                  id="save-request-collection"
                  value={targetCollectionId}
                  onChange={(event) => setSaveCollectionId(event.target.value)}
                  className="h-9 text-xs"
                >
                  {!targetCollectionId ? <option value="">Select a collection</option> : null}
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </Select>
              </>
            ) : (
              <div className="rounded-lg border border-warning/25 bg-warning/[0.07] px-3 py-2.5 text-xs leading-relaxed text-foreground">
                You need a collection before saving. Create one from the collections panel in the
                sidebar, then save this request here.
              </div>
            )}
          </div>

          {saveError ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSaveModal(false)}
              disabled={saveBusy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveBusy}
              disabled={!saveName.trim() || (!existingEndpointId && !targetCollectionId)}
            >
              {existingEndpointId ? 'Update request' : 'Save request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
