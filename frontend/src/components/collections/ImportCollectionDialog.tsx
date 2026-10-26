'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { collectionApi } from '@/lib/api';
import { useCollectionStore } from '@/store/collectionStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

export function ImportCollectionDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fetchCollections = useCollectionStore((state) => state.fetchCollections);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setValue('');
    setFileName('');
    setError('');
  };

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('That file is larger than 2 MB.');
      return;
    }
    try {
      const text = await file.text();
      setValue(text);
      setFileName(file.name);
      setError('');
    } catch {
      setError('Could not read that file.');
    }
  };

  const handleImport = async () => {
    if (!value.trim()) {
      setError('Paste a collection export or choose a JSON file.');
      return;
    }
    try {
      JSON.parse(value);
    } catch {
      setError('That is not valid JSON. Check the export and try again.');
      return;
    }

    setImporting(true);
    setError('');
    try {
      await collectionApi.import(JSON.parse(value));
      await fetchCollections();
      toast.success('Collection imported');
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Import failed. Check the file format and try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Import collection"
      description="Bring in a Nova or Postman-style JSON export. Nothing is sent anywhere except your workspace."
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="import-json" className="field-label mb-0">
              Collection JSON
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden />
              Choose file
            </Button>
          </div>
          <div className="relative">
            <Textarea
              id="import-json"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFileName('');
                if (error) setError('');
              }}
              placeholder={'{\n  "name": "My collection",\n  "endpoints": []\n}'}
              rows={10}
              spellCheck={false}
              className="font-mono text-xs leading-relaxed"
              aria-invalid={Boolean(error)}
            />
            {fileName ? (
              <span className="absolute right-2 top-2 rounded border border-border bg-surface px-1.5 py-0.5 text-2xs text-muted-foreground">
                {fileName}
              </span>
            ) : null}
          </div>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-xs text-muted-foreground">
          <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Existing collection IDs are always created as new collections in this workspace.
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Import collection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
