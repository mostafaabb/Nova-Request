'use client';

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
              ? `{\n  "key": "value"\n}`
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
}