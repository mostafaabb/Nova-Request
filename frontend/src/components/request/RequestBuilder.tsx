'use client';

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
import { AuthEditor } from './AuthEditor';
import { RequestTabs } from './RequestTabs';
import { ScriptEditor } from './ScriptEditor';
import { TestsTab } from './TestsTab';
import { Send, Save, Loader2, Plus, Code2, FlaskConical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function RequestBuilder() {
  const { getActiveTab, updateActiveTab, sendRequest, addTab, tabs } = useRequestStore();

  const activeTab = getActiveTab();
  const { currentCollection, currentEndpoint, createEndpoint, updateEndpoint } = useCollectionStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs, addTab]);

  if (!activeTab) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Plus className="h-12 w-12 mb-4 opacity-20" />
        <p>No open tabs</p>
        <Button variant="outline" className="mt-4" onClick={() => addTab()}>
          New Request
        </Button>
      </div>
    );
  }

  const handleSend = () => {
    if (!activeTab.url || !activeTab.url.trim()) {
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
        method: activeTab.method,
        url: activeTab.url,
        headers: activeTab.headers.filter((h) => h.key),
        queryParams: activeTab.queryParams.filter((p) => p.key),
        body: activeTab.body,
        bodyType: activeTab.bodyType,
        auth: activeTab.auth,
        formFields: activeTab.formFields.filter((f) => f.key),
        preRequestScript: activeTab.preRequestScript || null,
        postRequestScript: activeTab.postRequestScript || null,
        tests: activeTab.tests,
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
    setSaveName(
      activeTab.name !== 'New Request' ? activeTab.name : currentEndpoint?.name || ''
    );
    setSaveDescription(currentEndpoint?.description || '');
    setShowSaveModal(true);
  };

  const qpCount = (activeTab.queryParams || []).filter((p) => !!p.key).length;
  const hCount = (activeTab.headers || []).filter((h) => !!h.key).length;
  const testCount = (activeTab.tests || []).length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background/75">
      <div className="shrink-0">
        <RequestTabs />
      </div>

      <div className="shrink-0 p-4 border-b border-border/80 bg-background/70">
        <div className="command-bar flex flex-wrap gap-2 rounded-lg p-2">
          <Select
            value={activeTab.method}
            onChange={(e) => updateActiveTab({ method: e.target.value as HttpMethod })}
            className={cn(
              'w-[7.5rem] sm:w-28 h-11 font-black transition-all bg-background shrink-0',
              getMethodColor(activeTab.method)
            )}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>

          <Input
            placeholder="URL or {{variable}} — https://api.example.com/v1/resource"
            value={activeTab.url}
            onChange={(e) => updateActiveTab({ url: e.target.value })}
            className="flex-1 min-w-[12rem] mono-soft text-sm bg-background focus:bg-background transition-colors h-11"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button onClick={handleSend} disabled={activeTab.isLoading} className="h-11 px-5 font-bold flex-1 sm:flex-none">
              {activeTab.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>

            <Button
              variant="outline"
              onClick={openSaveModal}
              disabled={!currentCollection}
              className="h-11 font-bold flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Tabs defaultValue="params" className="h-full flex flex-col min-h-0">
          <div className="shrink-0 border-b border-border/80 px-2 sm:px-4 bg-muted/20 overflow-x-auto">
            <TabsList className="bg-transparent gap-1 sm:gap-4 min-h-11 h-auto py-1 flex-wrap sm:flex-nowrap justify-start w-max max-w-none">
              <TabsTrigger
                value="params"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-2 sm:px-1 h-10 text-[10px] sm:text-xs font-black uppercase tracking-wide"
              >
                Params
                {qpCount > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {qpCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="auth"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-2 sm:px-1 h-10 text-[10px] sm:text-xs font-black uppercase tracking-wide"
              >
                Auth
              </TabsTrigger>
              <TabsTrigger
                value="headers"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-2 sm:px-1 h-10 text-[10px] sm:text-xs font-black uppercase tracking-wide"
              >
                Headers
                {hCount > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {hCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="body"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-2 sm:px-1 h-10 text-[10px] sm:text-xs font-black uppercase tracking-wide"
              >
                Body
              </TabsTrigger>
              <TabsTrigger
                value="scripts"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-2 sm:px-1 h-10 text-[10px] sm:text-xs font-black uppercase tracking-wide gap-1"
              >
                <Code2 className="h-3 w-3 opacity-70 hidden sm:inline" />
                Scripts
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-2 sm:px-1 h-10 text-[10px] sm:text-xs font-black uppercase tracking-wide gap-1"
              >
                <FlaskConical className="h-3 w-3 opacity-70 hidden sm:inline" />
                Tests
                {testCount > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {testCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <TabsContent value="params" className="p-4 h-full m-0 border-0 outline-none mt-0">
              <ParamsEditor variant="query" />
            </TabsContent>
            <TabsContent value="auth" className="p-4 h-full m-0 border-0 outline-none mt-0">
              <AuthEditor />
            </TabsContent>
            <TabsContent value="headers" className="p-4 h-full m-0 border-0 outline-none mt-0">
              <HeadersEditor />
            </TabsContent>
            <TabsContent value="body" className="p-4 h-full m-0 border-0 outline-none mt-0">
              <BodyEditor />
            </TabsContent>
            <TabsContent value="scripts" className="p-4 h-full m-0 border-0 outline-none mt-0">
              <Tabs defaultValue="pre" className="h-full flex flex-col gap-3">
                <TabsList className="w-fit bg-muted/40 p-1 rounded-lg h-9">
                  <TabsTrigger value="pre" className="text-[10px] font-bold uppercase px-3 py-1 h-7">
                    Pre-request
                  </TabsTrigger>
                  <TabsTrigger value="post" className="text-[10px] font-bold uppercase px-3 py-1 h-7">
                    Post-request
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pre" className="mt-0 flex-1 m-0 border-0 outline-none">
                  <ScriptEditor
                    value={activeTab.preRequestScript}
                    onChange={(v) => updateActiveTab({ preRequestScript: v })}
                    scriptType="pre"
                  />
                </TabsContent>
                <TabsContent value="post" className="mt-0 flex-1 m-0 border-0 outline-none">
                  <ScriptEditor
                    value={activeTab.postRequestScript}
                    onChange={(v) => updateActiveTab({ postRequestScript: v })}
                    scriptType="post"
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="tests" className="p-4 h-full m-0 border-0 outline-none mt-0">
              <TestsTab
                tests={activeTab.tests}
                onChange={(tests) => updateActiveTab({ tests })}
                testResults={activeTab.response?.tests}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

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
            <Button onClick={handleSave}>{currentEndpoint ? 'Update' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
