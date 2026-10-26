'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Plus,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { useEnvironmentStore, type EnvVariable } from '@/store/environmentStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function EnvironmentManagerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    addEnvironment,
    deleteEnvironment,
    updateVariable,
    addVariable,
    removeVariable,
  } = useEnvironmentStore();

  const [selectedId, setSelectedId] = useState('globals');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId(activeEnvironmentId || 'globals');
    setNewName('');
    setShowValues(false);
  }, [open, activeEnvironmentId]);

  const selected = environments.find((env) => env.id === selectedId) || environments[0];

  const duplicateKeys = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    selected?.variables.forEach((variable) => {
      const key = variable.key.trim();
      if (!key) return;
      if (seen.has(key)) duplicates.add(key);
      seen.add(key);
    });
    return duplicates;
  }, [selected]);

  const selectEnvironment = (id: string) => {
    setSelectedId(id);
    setActiveEnvironment(id === 'globals' ? null : id);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const previousIds = new Set(environments.map((env) => env.id));
    try {
      await addEnvironment(name);
      const created = useEnvironmentStore
        .getState()
        .environments.find((env) => !previousIds.has(env.id));
      if (created) selectEnvironment(created.id);
      setNewName('');
      toast.success('Environment created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Could not create environment');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.id === 'globals') return;
    setDeleting(true);
    try {
      await deleteEnvironment(selected.id);
      setSelectedId('globals');
      setDeleteOpen(false);
      toast.success('Environment deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not delete environment');
    } finally {
      setDeleting(false);
    }
  };

  const update = (index: number, variable: EnvVariable) => {
    if (!selected) return;
    updateVariable(selected.id, index, variable);
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title="Environments"
        description="Variables are available as {{name}} tokens inside requests."
        className="max-w-4xl"
        bodyClassName="p-0"
      >
        <div className="flex h-[min(72dvh,560px)] flex-col sm:flex-row">
          <aside className="flex shrink-0 flex-col border-b border-border bg-surface-2/30 sm:w-56 sm:border-b-0 sm:border-r">
            <div className="hidden px-4 pb-2 pt-4 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block">
              Environments
            </div>
            <div className="flex gap-1 overflow-x-auto p-2 sm:block sm:flex-1 sm:space-y-0.5 sm:overflow-y-auto sm:px-2 sm:py-1">
              {environments.map((env) => {
                const isSelected = env.id === selected?.id;
                const isActive =
                  env.id === 'globals' ? !activeEnvironmentId : activeEnvironmentId === env.id;
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => selectEnvironment(env.id)}
                    className={cn(
                      'flex min-h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium transition-colors sm:w-full',
                      isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                    )}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{env.name}</span>
                    {isActive ? (
                      <span
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        title="Active environment"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border p-2">
              <div className="flex gap-1.5">
                <Input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleCreate();
                  }}
                  placeholder="New environment"
                  className="h-8 min-w-0 text-xs"
                  aria-label="New environment name"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  aria-label="Create environment"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  )}
                </Button>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            {selected ? (
              <>
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{selected.name}</h3>
                      {selected.id === 'globals' ? <Badge>Always available</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selected.id === 'globals'
                        ? 'Global variables apply to every environment in this session.'
                        : 'Changes save automatically to this workspace.'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowValues((value) => !value)}
                      aria-label={showValues ? 'Hide variable values' : 'Show variable values'}
                      title={showValues ? 'Hide values' : 'Show values'}
                    >
                      {showValues ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                    {selected.id !== 'globals' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteOpen(true)}
                        aria-label="Delete environment"
                        title="Delete environment"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {selected.variables.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-2/25 px-6 py-10 text-center">
                      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
                        <Settings2 className="h-4 w-4" aria-hidden />
                      </span>
                      <p className="text-[13px] font-semibold">No variables yet</p>
                      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                        Reference values in URLs, headers, and bodies with{' '}
                        <code className="font-mono text-foreground">{'{{name}}'}</code>.
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-4"
                        onClick={() => addVariable(selected.id)}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Add variable
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 pb-2 text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        <span>Variable</span>
                        <span>Value</span>
                        <span className="w-8" />
                      </div>
                      <div className="space-y-2">
                        {selected.variables.map((variable, index) => {
                          const isDuplicate =
                            variable.key.trim() && duplicateKeys.has(variable.key.trim());
                          return (
                            <div
                              key={`${selected.id}-${index}`}
                              className="group grid grid-cols-[1fr_1fr_auto] items-center gap-2"
                            >
                              <Input
                                value={variable.key}
                                onChange={(event) =>
                                  update(index, { ...variable, key: event.target.value })
                                }
                                placeholder="base_url"
                                className="h-9 font-mono text-xs"
                                aria-label={`Variable ${index + 1} name`}
                                aria-invalid={Boolean(isDuplicate)}
                              />
                              <Input
                                type={showValues ? 'text' : 'password'}
                                value={variable.value}
                                onChange={(event) =>
                                  update(index, { ...variable, value: event.target.value })
                                }
                                placeholder="https://api.example.com"
                                className="h-9 font-mono text-xs"
                                aria-label={`Variable ${index + 1} value`}
                                autoComplete="off"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => removeVariable(selected.id, index)}
                                aria-label={`Remove ${variable.key || 'variable'}`}
                              >
                                <X className="h-4 w-4" aria-hidden />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      {duplicateKeys.size > 0 ? (
                        <p className="mt-3 rounded-md border border-warning/25 bg-warning/[0.07] px-2.5 py-2 text-2xs leading-relaxed text-warning">
                          Duplicate keys: {Array.from(duplicateKeys).join(', ')}. The last value wins
                          when a request runs.
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 w-full border border-dashed border-border"
                        onClick={() => addVariable(selected.id)}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Add variable
                      </Button>
                      <p className="mt-3 text-2xs leading-relaxed text-muted-foreground">
                        Values are stored with this workspace. Use the eye control to mask them on
                        screen, and avoid keeping long-lived production secrets here.
                      </p>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${selected?.name || 'environment'}?`}
        description="This removes the environment and all of its variables for everyone in the workspace. This cannot be undone."
        confirmLabel="Delete environment"
        loading={deleting}
      />
    </>
  );
}
