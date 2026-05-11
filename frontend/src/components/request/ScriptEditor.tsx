'use client';

import { useEffect, useState } from 'react';
import { Code2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  scriptType: 'pre' | 'post';
}

export function ScriptEditor({ value, onChange, scriptType }: ScriptEditorProps) {
  const [code, setCode] = useState(value || '');

  useEffect(() => {
    setCode(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCode(newValue);
    onChange(newValue);
  };

  const snippets = {
    pre: `// Pre-request script - runs before the request
// Available context: request, environment

// Example: Set a header
// request.headers['X-Custom-Header'] = 'value';

// Example: Add auth token
// const token = environment.auth_token;
// request.headers['Authorization'] = \`Bearer \${token}\`;

// Example: Parse environment variable
// request.url = request.url.replace('{{host}}', environment.host);
`,
    post: `// Post-request script - runs after the request
// Available context: response, request, environment

// Example: Extract token from response
// const token = response.data.token;
// environment.auth_token = token;

// Example: Log response
// console.log('Response status:', response.status);

// Example: Validate response
// if (response.status !== 200) {
//   throw new Error('Request failed');
// }
`
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm capitalize">{scriptType}-Request Script</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCode(code + '\n\n' + snippets[scriptType])}
          className="text-xs"
        >
          <Info className="h-3 w-3 mr-1" />
          Insert Example
        </Button>
      </div>

      <textarea
        value={code}
        onChange={handleChange}
        placeholder={`Enter ${scriptType}-request JavaScript code...`}
        className="flex-1 p-4 font-mono text-xs bg-muted/50 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-b-lg"
        spellCheck="false"
      />

      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground bg-muted/20">
        <p>💡 Write JavaScript code. Access: <code className="bg-black/20 px-1 rounded">request</code>, <code className="bg-black/20 px-1 rounded">response</code>, <code className="bg-black/20 px-1 rounded">environment</code></p>
      </div>
    </div>
  );
}
