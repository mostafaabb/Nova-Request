'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Loader2, ShieldAlert } from 'lucide-react';
import type { Collection } from '@/types';
import { useCollectionStore } from '@/store/collectionStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ShareCollectionDialog({
  open,
  onClose,
  collection,
}: {
  open: boolean;
  onClose: () => void;
  collection: Collection | null;
}) {
  const generateShareLink = useCollectionStore((state) => state.generateShareLink);
  const removeShareLink = useCollectionStore((state) => state.removeShareLink);
  const [shareUrl, setShareUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    if (!open || !collection) return;
    setCopied(false);
    setError('');
    setConfirmRevoke(false);
    setShareUrl(
      collection.shareId
        ? `${window.location.origin}/share/${collection.shareId}`
        : ''
    );
  }, [open, collection]);

  if (!collection) return null;

  const createLink = async () => {
    setBusy(true);
    setError('');
    try {
      const url = await generateShareLink(collection.id);
      const absolute = url?.startsWith('http')
        ? url
        : `${window.location.origin}${url || `/share/${collection.shareId}`}`;
      setShareUrl(absolute);
      toast.success('Share link created');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not create a share link.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard access was blocked by the browser.');
    }
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await removeShareLink(collection.id);
      setShareUrl('');
      setConfirmRevoke(false);
      toast.success('Share link revoked');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not revoke the link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Share collection"
      description={`Publish a read-only view of “${collection.name}”.`}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {shareUrl ? (
          <>
            <div>
              <label htmlFor="share-url" className="field-label">
                Public link
              </label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="secondary" onClick={handleCopy} className="shrink-0">
                  {copied ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Open public view
              </Button>
              <Button
                variant={confirmRevoke ? 'destructive' : 'ghost'}
                size="sm"
                onClick={handleRevoke}
                disabled={busy}
                onBlur={() => setConfirmRevoke(false)}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                {confirmRevoke ? 'Revoke link?' : 'Revoke link'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface-2/30 px-6 py-8 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
              <Link2 className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <p className="text-[13px] font-semibold">No public link yet</p>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Anyone with the link can view the collection&apos;s request definitions in read-only
              mode. They cannot send requests or edit your workspace.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={createLink} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
              Create share link
            </Button>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/[0.07] px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          <p>
            Public views show request definitions, including headers. Sensitive header values are
            masked on the public page, but avoid saving secrets in request bodies or URLs.
          </p>
        </div>

        {error ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
