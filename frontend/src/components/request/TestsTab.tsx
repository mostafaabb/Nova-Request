'use client';

import { useMemo, useState } from 'react';
import { Check, FlaskConical, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import type { RequestTest } from '@/types';

interface TestResult {
  passed?: boolean;
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

interface TestsTabProps {
  tests: RequestTest[];
  onChange: (tests: RequestTest[]) => void;
  testResults?: {
    passed: number;
    failed: number;
    results: unknown[];
  };
}

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'does not contain' },
  { value: 'greaterThan', label: 'is greater than' },
  { value: 'lessThan', label: 'is less than' },
  { value: 'exists', label: 'exists' },
  { value: 'notExists', label: 'does not exist' },
  { value: 'isType', label: 'is type' },
];

const EMPTY_TEST: RequestTest = {
  path: '',
  operator: 'equals',
  value: '',
  name: '',
};

export function TestsTab({ tests = [], onChange, testResults }: TestsTabProps) {
  const [newTest, setNewTest] = useState<RequestTest>(EMPTY_TEST);
  const [showComposer, setShowComposer] = useState(false);

  const summary = useMemo(() => {
    if (!testResults) return null;
    return {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.passed + testResults.failed,
    };
  }, [testResults]);

  const handleAddTest = () => {
    if (!newTest.path.trim()) return;
    onChange([...tests, { ...newTest, path: newTest.path.trim() }]);
    setNewTest(EMPTY_TEST);
    setShowComposer(false);
  };

  const handleUpdateTest = (index: number, field: keyof RequestTest, value: string) => {
    onChange(tests.map((test, testIndex) => (testIndex === index ? { ...test, [field]: value } : test)));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Assertions
          </p>
          {summary ? (
            <p className="mt-1 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-medium text-success">
                <Check className="h-3.5 w-3.5" aria-hidden />
                {summary.passed} passed
              </span>
              {summary.failed > 0 ? (
                <span className="flex items-center gap-1 font-medium text-destructive">
                  <X className="h-3.5 w-3.5" aria-hidden />
                  {summary.failed} failed
                </span>
              ) : null}
              <span className="text-muted-foreground">of {summary.total}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Validate the response after each send.
            </p>
          )}
        </div>
        <Button
          variant={showComposer ? 'ghost' : 'secondary'}
          size="xs"
          onClick={() => setShowComposer((value) => !value)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add test
        </Button>
      </div>

      {tests.length === 0 && !showComposer ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-2/25 px-6 py-10 text-center">
          <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
            <FlaskConical className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-[13px] font-semibold text-foreground">No tests yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Add assertions against response fields using JSONPath or simple dot notation.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowComposer(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add your first test
          </Button>
        </div>
      ) : null}

      {tests.length > 0 ? (
        <div className="space-y-2">
          {tests.map((test, index) => {
            const result = (testResults?.results?.[index] || null) as TestResult | null;
            return (
              <div
                key={index}
                className={cn(
                  'rounded-lg border bg-surface p-3',
                  result?.passed === true && 'border-success/30',
                  result?.passed === false && 'border-destructive/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={`Test ${index + 1} name (optional)`}
                    value={test.name || ''}
                    onChange={(event) => handleUpdateTest(index, 'name', event.target.value)}
                    className="h-8 flex-1 border-transparent bg-transparent px-1.5 text-xs hover:border-border focus:bg-surface-2/60"
                    aria-label={`Test ${index + 1} name`}
                  />
                  {result ? (
                    <span
                      className={cn(
                        'shrink-0 rounded border px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wide',
                        result.passed
                          ? 'border-success/25 bg-success/10 text-success'
                          : 'border-destructive/25 bg-destructive/10 text-destructive'
                      )}
                    >
                      {result.passed ? 'Pass' : 'Fail'}
                    </span>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(tests.filter((_, testIndex) => testIndex !== index))}
                    aria-label={`Remove test ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div>
                    <label htmlFor={`test-path-${index}`} className="sr-only">
                      Response path
                    </label>
                    <Input
                      id={`test-path-${index}`}
                      placeholder="$.data.id"
                      value={test.path}
                      onChange={(event) => handleUpdateTest(index, 'path', event.target.value)}
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor={`test-operator-${index}`} className="sr-only">
                      Operator
                    </label>
                    <Select
                      id={`test-operator-${index}`}
                      value={test.operator}
                      onChange={(event) => handleUpdateTest(index, 'operator', event.target.value)}
                      className="h-8 text-xs"
                    >
                      {OPERATORS.map((operator) => (
                        <option key={operator.value} value={operator.value}>
                          {operator.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`test-value-${index}`} className="sr-only">
                      Expected value
                    </label>
                    <Input
                      id={`test-value-${index}`}
                      placeholder="Expected value"
                      value={test.value}
                      onChange={(event) => handleUpdateTest(index, 'value', event.target.value)}
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                {result && (result.expected !== undefined || result.actual !== undefined || result.error) ? (
                  <div className="mt-2 rounded-md border border-border bg-surface-2/50 px-2.5 py-2 font-mono text-2xs text-muted-foreground">
                    {result.expected !== undefined ? (
                      <span>
                        expected <span className="text-foreground">{String(result.expected)}</span>
                      </span>
                    ) : null}
                    {result.actual !== undefined ? (
                      <span className="ml-3">
                        received <span className="text-foreground">{String(result.actual)}</span>
                      </span>
                    ) : null}
                    {result.error ? <p className="mt-1 text-destructive">{result.error}</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {showComposer ? (
        <div className="rounded-lg border border-primary/25 bg-primary/[0.04] p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label htmlFor="new-test-path" className="field-label text-2xs">
                Path
              </label>
              <Input
                id="new-test-path"
                placeholder="$.data.id or status"
                value={newTest.path}
                onChange={(event) => setNewTest({ ...newTest, path: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAddTest();
                }}
                className="h-8 font-mono text-xs"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="new-test-operator" className="field-label text-2xs">
                Operator
              </label>
              <Select
                id="new-test-operator"
                value={newTest.operator}
                onChange={(event) => setNewTest({ ...newTest, operator: event.target.value })}
                className="h-8 text-xs"
              >
                {OPERATORS.map((operator) => (
                  <option key={operator.value} value={operator.value}>
                    {operator.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="new-test-value" className="field-label text-2xs">
                Expected value
              </label>
              <Input
                id="new-test-value"
                placeholder="Value"
                value={newTest.value}
                onChange={(event) => setNewTest({ ...newTest, value: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAddTest();
                }}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-2xs text-muted-foreground">
              Examples: <code className="font-mono text-foreground">status</code>,{' '}
              <code className="font-mono text-foreground">$.data.message</code>,{' '}
              <code className="font-mono text-foreground">$.0.id</code>
            </p>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="xs" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button size="xs" onClick={handleAddTest} disabled={!newTest.path.trim()}>
                Add test
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
