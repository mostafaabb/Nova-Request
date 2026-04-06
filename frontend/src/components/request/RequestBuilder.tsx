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
}