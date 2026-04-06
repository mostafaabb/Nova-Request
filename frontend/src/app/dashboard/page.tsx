'use client';

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
}