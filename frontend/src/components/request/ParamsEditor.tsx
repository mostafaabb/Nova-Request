'use client';

import { useRequestStore } from '@/store/requestStore';
import { KeyValueEditor } from './KeyValueEditor';

interface ParamsEditorProps {
  variant?: 'query' | 'form';
}

export function ParamsEditor({ variant = 'query' }: ParamsEditorProps) {
  const { getActiveTab, updateActiveTab } = useRequestStore();
  const activeTab = getActiveTab();

  if (!activeTab) return null;

  const isForm = variant === 'form';
  const rows = (isForm ? activeTab.formFields : activeTab.queryParams) || [];

  return (
    <KeyValueEditor
      idPrefix={isForm ? 'form-field' : 'query-param'}
      rows={rows}
      onChange={(next) => updateActiveTab(isForm ? { formFields: next } : { queryParams: next })}
      keyPlaceholder={isForm ? 'field' : 'parameter'}
      valuePlaceholder={isForm ? 'value' : 'value'}
      addLabel={isForm ? 'Add field' : 'Add parameter'}
      emptyTitle={isForm ? 'No form fields' : 'No query parameters'}
      emptyDescription={
        isForm
          ? 'Add key/value pairs for multipart or URL-encoded request bodies.'
          : 'Query parameters are appended to the request URL when it is sent.'
      }
    />
  );
}
