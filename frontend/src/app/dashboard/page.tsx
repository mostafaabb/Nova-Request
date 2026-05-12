'use client';

import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ResponseViewer } from '@/components/response/ResponseViewer';
import { ResizableSplit } from '@/components/layout/ResizableSplit';

export default function DashboardPage() {
  return (
    <div className="h-full bg-muted/15">
      <ResizableSplit
        defaultSize={50}
        minSize={28}
        maxSize={72}
        storageKey="nova-request-response-width"
        handleClassName="border-x border-border/60 bg-muted/20"
        first={
          <div className="h-full min-h-0">
            <RequestBuilder />
          </div>
        }
        second={
          <div className="h-full min-h-0 overflow-auto bg-background/30">
            <ResponseViewer />
          </div>
        }
      />
    </div>
  );
}
