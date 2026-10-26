'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCollectionStore } from '@/store/collectionStore';
import type { Collection } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

interface CollectionFormDialogProps {
  open: boolean;
  onClose: () => void;
  collection?: Collection | null;
}

export function CollectionFormDialog({ open, onClose, collection }: CollectionFormDialogProps) {
  const { createCollection, updateCollection } = useCollectionStore();
  const isEdit = Boolean(collection);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(collection?.name || '');
    setDescription(collection?.description || '');
    setError('');
  }, [open, collection]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('A collection name is required.');
      return;
    }
    if (trimmed.length > 80) {
      setError('Keep the name under 80 characters.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isEdit && collection) {
        await updateCollection(collection.id, { name: trimmed, description: description.trim() });
        toast.success('Collection updated');
      } else {
        await createCollection(trimmed, description.trim() || undefined);
        toast.success('Collection created');
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Could not save the collection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Edit collection' : 'New collection'}
      description={
        isEdit
          ? 'Update how this collection is labelled across your workspace.'
          : 'Collections keep related requests and documentation together.'
      }
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="collection-name" className="field-label">
            Name
          </label>
          <Input
            id="collection-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError('');
            }}
            placeholder="Payments API"
            autoFocus
            maxLength={80}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'collection-name-error' : undefined}
          />
          {error ? (
            <p id="collection-name-error" className="field-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="collection-description" className="field-label">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="collection-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does this collection cover?"
            rows={3}
            maxLength={240}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {isEdit ? 'Save changes' : 'Create collection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
