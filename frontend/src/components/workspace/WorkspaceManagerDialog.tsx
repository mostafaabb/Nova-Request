'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock3,
  Loader2,
  Mail,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import type { WorkspaceMember } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

type Role = 'owner' | 'admin' | 'member';

export function WorkspaceManagerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    members,
    workspacePendingInvites,
    fetchMembers,
    fetchWorkspacePendingInvites,
    revokeWorkspaceInvite,
    inviteMember,
    updateMemberRole,
    removeMember,
    isMembersLoading,
    isWorkspaceInvitesLoading,
  } = useWorkspaceStore();

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );
  const canManageMembers = activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin';

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !activeWorkspace?.id) return;
    Promise.all([
      fetchMembers(activeWorkspace.id),
      canManageMembers ? fetchWorkspacePendingInvites(activeWorkspace.id) : Promise.resolve(),
    ]).catch(() => {
      // Individual errors are surfaced by the action that failed.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeWorkspace?.id]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createWorkspace(name);
      setNewName('');
      toast.success('Workspace created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const result = await inviteMember(activeWorkspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      if (result.member) {
        toast.success('Member added to this workspace');
      } else if (result.invitation) {
        toast.success(result.message || 'Invitation saved for this email');
      } else {
        toast.success('Invitation sent');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: WorkspaceMember, role: Role) => {
    if (!activeWorkspace) return;
    try {
      await updateMemberRole(activeWorkspace.id, member.id, role);
      toast.success('Role updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not update role');
    }
  };

  const handleRemove = async () => {
    if (!activeWorkspace || !memberToRemove) return;
    setRemoving(true);
    try {
      await removeMember(activeWorkspace.id, memberToRemove.id);
      setMemberToRemove(null);
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not remove member');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title="Workspace"
        description="Manage the shared space, its members, and pending invitations."
        className="max-w-5xl"
        bodyClassName="p-0"
      >
        <div className="flex min-h-[min(70dvh,580px)] flex-col md:flex-row">
          <aside className="flex shrink-0 flex-col border-b border-border bg-surface-2/30 md:w-64 md:border-b-0 md:border-r">
            <div className="px-4 pb-2 pt-4 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Your workspaces
            </div>
            <div className="max-h-48 space-y-0.5 overflow-y-auto px-2 md:max-h-none md:flex-1">
              {workspaces.map((workspace) => {
                const isSelected = workspace.id === activeWorkspace?.id;
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => setActiveWorkspace(workspace.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                    )}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-surface text-3xs font-semibold uppercase text-muted-foreground">
                      {workspace.name.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{workspace.name}</span>
                      <span className="block text-2xs text-muted-foreground">
                        {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                  </button>
                );
              })}
              {workspaces.length === 0 ? (
                <p className="px-2.5 py-2 text-xs text-muted-foreground">No workspaces yet.</p>
              ) : null}
            </div>
            <div className="border-t border-border p-2">
              <div className="flex gap-1.5">
                <Input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleCreate();
                  }}
                  placeholder="New workspace"
                  className="h-8 min-w-0 text-xs"
                  aria-label="New workspace name"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  aria-label="Create workspace"
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

          <section className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {activeWorkspace ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold tracking-[-0.01em]">
                      {activeWorkspace.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {activeWorkspace.memberCount}{' '}
                        {activeWorkspace.memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Shield className="h-3.5 w-3.5" aria-hidden />
                        {activeWorkspace.role}
                      </span>
                    </div>
                  </div>
                  <Badge variant="neutral">Your role: {activeWorkspace.role}</Badge>
                </div>

                <div className="mt-5 rounded-lg border border-border bg-surface">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-3">
                    <div>
                      <h4 className="text-xs font-semibold">Invite a teammate</h4>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        Owners and admins can add people to this workspace.
                      </p>
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="p-3.5">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleInvite();
                        }}
                        placeholder="teammate@company.com"
                        className="min-w-0 flex-1"
                        aria-label="Teammate email"
                        disabled={!canManageMembers}
                      />
                      <Select
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value as Role)}
                        className="h-9 text-xs sm:w-28"
                        wrapperClassName="sm:w-28"
                        aria-label="Invitation role"
                        disabled={!canManageMembers}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </Select>
                      <Button
                        variant="primary"
                        onClick={handleInvite}
                        disabled={!canManageMembers || !inviteEmail.trim() || inviting}
                        className="shrink-0"
                      >
                        {inviting ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Mail className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Invite
                      </Button>
                    </div>
                    <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
                      If the email does not have an account yet, the invitation is applied when they
                      register or sign in.
                    </p>
                  </div>
                </div>

                {canManageMembers ? (
                  <div className="mt-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
                      <h4 className="flex items-center gap-2 text-xs font-semibold">
                        <Clock3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        Pending invitations
                      </h4>
                      {isWorkspaceInvitesLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                      ) : (
                        <span className="text-2xs text-muted-foreground">
                          {workspacePendingInvites.length}
                        </span>
                      )}
                    </div>
                    {workspacePendingInvites.length === 0 ? (
                      <p className="px-3.5 py-3 text-xs text-muted-foreground">
                        No pending invitations.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {workspacePendingInvites.map((invite) => (
                          <li
                            key={invite.id}
                            className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium">{invite.email}</p>
                              <p className="text-2xs capitalize text-muted-foreground">
                                {invite.role} · expires{' '}
                                {new Date(invite.expiresAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                              aria-label={`Revoke invitation for ${invite.email}`}
                              disabled={revokingId === invite.id}
                              onClick={async () => {
                                if (!activeWorkspace) return;
                                setRevokingId(invite.id);
                                try {
                                  await revokeWorkspaceInvite(activeWorkspace.id, invite.id);
                                  toast.success('Invitation revoked');
                                } catch (error: any) {
                                  toast.error(error.response?.data?.error || 'Could not revoke');
                                } finally {
                                  setRevokingId(null);
                                }
                              }}
                            >
                              {revokingId === invite.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              )}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold">Members</h4>
                    {isMembersLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                    ) : (
                      <span className="text-2xs text-muted-foreground">{members.length}</span>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    {members.length === 0 && !isMembersLoading ? (
                      <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">
                        No members loaded.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {members.map((member) => (
                          <li
                            key={member.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-3xs font-semibold text-muted-foreground">
                                {getInitials(member.user.name, member.user.email)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {member.user.name}
                                  {member.user.id === user?.id ? (
                                    <span className="ml-1.5 text-2xs font-normal text-muted-foreground">
                                      (you)
                                    </span>
                                  ) : null}
                                </p>
                                <p className="truncate text-2xs text-muted-foreground">
                                  {member.user.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Select
                                value={member.role}
                                onChange={(event) =>
                                  handleRoleChange(member, event.target.value as Role)
                                }
                                className="h-8 text-xs"
                                wrapperClassName="w-28"
                                aria-label={`Role for ${member.user.email}`}
                                disabled={!canManageMembers}
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                              </Select>
                              {canManageMembers ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setMemberToRemove(member)}
                                  aria-label={`Remove ${member.user.email}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Create a workspace to get started.
              </div>
            )}
          </section>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemove}
        title="Remove member?"
        description={
          memberToRemove
            ? `${memberToRemove.user.name} will lose access to “${activeWorkspace?.name}”. Their account is not deleted.`
            : ''
        }
        confirmLabel="Remove member"
        loading={removing}
      />
    </>
  );
}
