'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import type { RequestTest } from '@/types';

interface TestsTabProps {
  tests: RequestTest[];
  onChange: (tests: RequestTest[]) => void;
  testResults?: {
    passed: number;
    failed: number;
    results: any[];
  };
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'exists', label: 'Exists' },
  { value: 'notExists', label: 'Not Exists' },
  { value: 'isType', label: 'Is Type' },
];

export function TestsTab({ tests = [], onChange, testResults }: TestsTabProps) {
  const [newTest, setNewTest] = useState<RequestTest>({
    path: '',
    operator: 'equals',
    value: '',
    name: '',
  });

  const handleAddTest = () => {
    if (newTest.path.trim()) {
      onChange([...tests, { ...newTest, path: newTest.path.trim() }]);
      setNewTest({ path: '', operator: 'equals', value: '', name: '' });
    }
  };

  const handleUpdateTest = (index: number, field: keyof RequestTest, value: string) => {
    const updated = [...tests];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemoveTest = (index: number) => {
    onChange(tests.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
        <h3 className="font-semibold text-sm">Test Assertions</h3>
        {testResults && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {testResults.passed} passed
            </span>
            {testResults.failed > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <X className="h-3 w-3" />
                {testResults.failed} failed
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            <p>{`No tests added. Click "Add Test" to get started.`}</p>
          </div>
        ) : (
          tests.map((test, idx) => {
            const result = testResults?.results?.[idx];
            return (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg border border-border bg-muted/20 space-y-2',
                  result && (result.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5')
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Test name (optional)"
                    value={test.name || ''}
                    onChange={(e) => handleUpdateTest(idx, 'name', e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  {result && (
                    <span className={cn('text-[10px] font-bold uppercase', result.passed ? 'text-green-600' : 'text-red-600')}>
                      {result.passed ? '✓ Pass' : '✗ Fail'}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveTest(idx)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                  <Input
                    placeholder="Path (e.g. $.status or status)"
                    value={test.path}
                    onChange={(e) => handleUpdateTest(idx, 'path', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Select
                    value={test.operator}
                    onChange={(e) => handleUpdateTest(idx, 'operator', e.target.value)}
                    className="h-8 text-xs w-32"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Value"
                    value={test.value}
                    onChange={(e) => handleUpdateTest(idx, 'value', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {result && (
                  <div className="text-[11px] text-muted-foreground bg-black/10 rounded p-2">
                    Expected: <code>{String(result.expected)}</code> | Got: <code>{String(result.actual)}</code>
                    {result.error && <p className="text-red-600">Error: {result.error}</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-4 bg-muted/20">
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center mb-3">
          <Input
            placeholder="Path"
            value={newTest.path}
            onChange={(e) => setNewTest({ ...newTest, path: e.target.value })}
            className="h-9 text-xs"
          />
          <Select
            value={newTest.operator}
            onChange={(e) => setNewTest({ ...newTest, operator: e.target.value })}
            className="h-9 text-xs w-32"
          >
            {OPERATORS.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Select>
          <Input
            placeholder="Value"
            value={newTest.value}
            onChange={(e) => setNewTest({ ...newTest, value: e.target.value })}
            className="h-9 text-xs"
          />
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={handleAddTest}
            disabled={!newTest.path.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Use JSONPath ($.field.nested) or simple field names. Examples: status, $.data.message, $.0.id
        </p>
      </div>
    </div>
  );
}
