'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/Button';
import { Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export function PendingInvitationsBanner() {
  const {
    myInvitations,
    isMyInvitationsLoading,
    acceptInvitation,
    setActiveWorkspace,
    fetchMyInvitations,
  } = useWorkspaceStore();
  const [busyToken, setBusyToken] = useState<string | null>(null);

  if (isMyInvitationsLoading && myInvitations.length === 0) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        Checking invitations…
      </div>
    );
  }

  if (!myInvitations.length) return null;

  return (
    <div className="mb-3 space-y-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.07] to-transparent px-4 py-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary shrink-0" aria-hidden />
        <p className="text-sm font-semibold text-foreground">Workspace invitations</p>
      </div>
      <ul className="space-y-2">
        {myInvitations.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-col gap-3 rounded-lg border border-border/80 bg-background/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{inv.workspace.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                From {inv.invitedBy.name} · Role: <span className="capitalize">{inv.role}</span>
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              disabled={busyToken === inv.token}
              onClick={async () => {
                setBusyToken(inv.token);
                try {
                  const r = await acceptInvitation(inv.token);
                  toast.success(`Joined ${r.workspaceName}`);
                  setActiveWorkspace(r.workspaceId);
                } catch (error: unknown) {
                  const msg =
                    typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { error?: string } } }).response?.data
                      ?.error === 'string'
                      ? (error as { response: { data: { error: string } } }).response.data.error
                      : 'Could not accept invitation';
                  toast.error(msg);
                  await fetchMyInvitations().catch(() => {});
                } finally {
                  setBusyToken(null);
                }
              }}
            >
              {busyToken === inv.token ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Joining…
                </>
              ) : (
                'Accept & switch'
              )}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
