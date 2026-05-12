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
import { RequestTabs } from './RequestTabs';
import { Send, Save, Loader2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function RequestBuilder() {
  const {
    getActiveTab, updateActiveTab, sendRequest, addTab, tabs, activeTabId
  } = useRequestStore();
  
  const activeTab = getActiveTab();
  const { currentCollection, currentEndpoint, createEndpoint, updateEndpoint } = useCollectionStore();
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  // Initial tab if none
  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs, addTab]);

  if (!activeTab) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div className="rounded-lg border border-dashed border-border/50 bg-background/60 p-8">
          <Plus className="h-16 w-16 mx-auto mb-4 opacity-25" />
          <p className="text-sm font-semibold text-foreground">No open tabs</p>
          <p className="text-xs text-muted-foreground mt-1">Create a new request to get started</p>
        </div>
        <Button variant="outline" className="mt-2" onClick={() => addTab()}>
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
    console.log('Sending request to:', activeTab.url);
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
        headers: activeTab.headers.filter(h => h.key),
        queryParams: activeTab.queryParams.filter(p => p.key),
        body: activeTab.body,
        bodyType: activeTab.bodyType,
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
    setSaveName(activeTab.name !== 'New Request' ? activeTab.name : (currentEndpoint?.name || ''));
    setSaveDescription(currentEndpoint?.description || '');
    setShowSaveModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-background/60">
      {/* Tabs List */}
      <RequestTabs />

      {/* URL Bar */}
      <div className="px-6 py-4 border-b border-border/60 bg-background/70 shadow-sm">
        <div className="glass-panel flex gap-3 rounded-lg p-3">
          <Select 
            value={activeTab.method} 
            onChange={(e) => updateActiveTab({ method: e.target.value as HttpMethod })}
            className={cn('w-28 h-10 font-bold transition-smooth bg-background', getMethodColor(activeTab.method))}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>

          <Input
            placeholder="Enter URL (e.g., https://api.example.com/users) or use {{variables}}"
            value={activeTab.url}
            onChange={(e) => updateActiveTab({ url: e.target.value })}
            className="flex-1 mono-soft text-xs bg-background focus:bg-background transition-smooth h-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <Button onClick={handleSend} disabled={activeTab.isLoading} className="h-10 px-6 font-semibold">
            {activeTab.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>

          <Button variant="outline" onClick={openSaveModal} disabled={!currentCollection} className="h-10 font-semibold">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Request Config Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="params" className="h-full flex flex-col">
          <div className="border-b border-border/60 px-6 bg-muted/15">
            <TabsList className="bg-transparent gap-8">
              <TabsTrigger value="params" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-0 h-11 text-xs font-semibold uppercase tracking-widest">
                Params
                {(Array.isArray(activeTab.queryParams) ? activeTab.queryParams : []).filter(p => !!p.key).length > 0 && (
                  <span className="ml-2 text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
                    {(Array.isArray(activeTab.queryParams) ? activeTab.queryParams : []).filter(p => !!p.key).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-0 h-11 text-xs font-semibold uppercase tracking-widest">
                Headers
                {(Array.isArray(activeTab.headers) ? activeTab.headers : []).filter(h => !!h.key).length > 0 && (
                  <span className="ml-2 text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
                    {(Array.isArray(activeTab.headers) ? activeTab.headers : []).filter(h => !!h.key).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="body" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none px-0 h-11 text-xs font-semibold uppercase tracking-widest">Body</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto bg-muted/10">
            <TabsContent value="params" className="px-6 py-4 h-full m-0 border-0 outline-none">
              <ParamsEditor />
            </TabsContent>
            <TabsContent value="headers" className="px-6 py-4 h-full m-0 border-0 outline-none">
              <HeadersEditor />
            </TabsContent>
            <TabsContent value="body" className="px-6 py-4 h-full m-0 border-0 outline-none">
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
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Name</label>
            <Input
              placeholder="Endpoint name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Description (optional)</label>
            <Input
              placeholder="What does this endpoint do?"
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
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
}
