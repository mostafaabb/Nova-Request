'use client';

import { useEffect, useRef, useState } from 'react';
import { Code2, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  scriptType: 'pre' | 'post';
}

const SNIPPETS = {
  pre: `// Runs before the request is sent.
// Available: request, environment

// request.headers['X-Custom-Header'] = 'value';

// const token = environment.auth_token;
// request.headers['Authorization'] = \`Bearer \${token}\`;
`,
  post: `// Runs after the response returns.
// Available: response, request, environment

// const token = response.data.token;
// environment.auth_token = token;

// if (response.status !== 200) {
//   throw new Error('Unexpected status');
// }
`,
};

export function ScriptEditor({ value, onChange, scriptType }: ScriptEditorProps) {
  const [code, setCode] = useState(value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(value || '');
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
    onChange(event.target.value);
  };

  const insertSnippet = () => {
    const next = code.trim() ? `${code.replace(/\s+$/, '')}\n\n${SNIPPETS[scriptType]}` : SNIPPETS[scriptType];
    setCode(next);
    onChange(next);
    textareaRef.current?.focus();
  };

  const lineCount = code ? code.split('\n').length : 1;

  return (
    <div className="flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-[hsl(var(--code-bg))]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium text-foreground">
            {scriptType === 'pre' ? 'Pre-request script' : 'Post-response script'}
          </span>
          <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-3xs text-muted-foreground">
            JavaScript
          </span>
        </div>
        <Button variant="ghost" size="xs" onClick={insertSnippet} className="gap-1.5">
          <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
          Insert example
        </Button>
      </div>

      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleChange}
        placeholder={`// ${scriptType === 'pre' ? 'Pre-request' : 'Post-response'} JavaScript`}
        aria-label={`${scriptType === 'pre' ? 'Pre-request' : 'Post-response'} script`}
        className="min-h-[14rem] flex-1 resize-y bg-transparent p-3 font-mono text-xs leading-6 text-foreground outline-none placeholder:text-muted-foreground/45 focus-visible:ring-0"
        spellCheck="false"
      />

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Context:
          <code className="font-mono text-foreground">request</code>
          <code className="font-mono text-foreground">response</code>
          <code className="font-mono text-foreground">environment</code>
        </span>
        <span className="ml-auto tabular-nums">{lineCount} lines</span>
      </div>
    </div>
  );
}
