'use client';

import { useTheme } from '@/components/ThemeProvider';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  Moon,
  Sun,
  History,
  Settings,
  Globe,
  Plus,
  Trash2,
  X,
  Zap,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    addEnvironment,
    deleteEnvironment,
    updateVariable,
    addVariable,
    removeVariable
  } = useEnvironmentStore();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    fetchMembers,
    members,
    inviteMember,
    updateMemberRole,
    removeMember,
    isMembersLoading
  } = useWorkspaceStore();

  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'member'>('member');

  const activeEnv = environments.find(e => e.id === activeEnvironmentId) || environments.find(e => e.id === 'globals');
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const activeWorkspaceIdSafe = activeWorkspace?.id || null;
  const canManageMembers = activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin';

  useEffect(() => {
    if (showWorkspaceModal && activeWorkspaceIdSafe) {
      fetchMembers(activeWorkspaceIdSafe).catch(() => {
        toast.error('Failed to load workspace members');
      });
    }
  }, [showWorkspaceModal, activeWorkspaceIdSafe, fetchMembers]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      toast.success('Workspace created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create workspace');
    }
  };

  const handleInviteMember = async () => {
    if (!activeWorkspaceIdSafe || !inviteEmail.trim()) return;
    try {
      await inviteMember(activeWorkspaceIdSafe, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      toast.success('Member invited');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to invite member');
    }
  };

  return (
    <header className="h-16 flex items-center px-4 sm:px-6 justify-between bg-background/60 backdrop-blur-lg sticky top-0 z-50 border-b border-border/60 shadow-sm">
      <div className="flex items-center gap-4 lg:gap-8 min-w-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight hover:text-primary transition-smooth group shrink-0">
          <div className="p-1.5 bg-primary rounded-md shadow-md shadow-primary/30 group-hover:rotate-6 transition-transform duration-200">
            <Zap className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="hidden sm:inline">Nova Request</span>
        </Link>
        <div className="h-8 w-px bg-border/50 hidden lg:block" />
        <div className="hidden md:flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 shadow-sm">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={activeWorkspace?.id || ''}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            className="w-44 lg:w-52 h-8 text-xs font-semibold bg-transparent border-none shadow-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            disabled={workspaces.length === 0}
          >
            {workspaces.length === 0 ? (
              <option value="">No workspace</option>
            ) : (
              workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} - {workspace.role}
                </option>
              ))
            )}
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setShowWorkspaceModal(true)}
            title="Manage workspace"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
        <div className="hidden xl:block h-8 w-px bg-border/50" />
        <div className="hidden sm:flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 shadow-sm">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={activeEnvironmentId || 'globals'}
            onChange={(e) => setActiveEnvironment(e.target.value === 'globals' ? null : e.target.value)}
            className="w-36 lg:w-44 h-8 text-xs font-semibold bg-transparent border-none shadow-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="globals">No Environment</option>
            {environments.filter(e => e.id !== 'globals').map((env) => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowEnvModal(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard/history">
          <Button variant="ghost" size="icon" className="h-10 w-10 transition-smooth" title="History">
            <History className="h-5 w-5" />
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 transition-smooth"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Workspace Manager Modal */}
      <Modal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        title="Workspace Manager"
        className="max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.9fr] gap-6 mt-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Workspaces</h3>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {workspaces.length} total
                </span>
              </div>
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => setActiveWorkspace(workspace.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      workspace.id === activeWorkspace?.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{workspace.name}</span>
                      <span className="text-[10px] uppercase">{workspace.role}</span>
                    </div>
                  </button>
                ))}
                {workspaces.length === 0 && (
                  <p className="text-xs text-muted-foreground">No workspaces yet</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="New workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                  className="h-9 text-xs"
                />
                <Button size="icon" className="h-9 w-9" onClick={handleCreateWorkspace}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-xl tracking-tight">{activeWorkspace?.name || 'Workspace'}</h3>
                <p className="text-xs text-muted-foreground">
                  Role: {activeWorkspace?.role || 'member'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="Invite by email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-9 text-xs"
                  disabled={!canManageMembers}
                />
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'owner' | 'admin' | 'member')}
                  className="h-9 text-xs w-32"
                  disabled={!canManageMembers}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </Select>
                <Button
                  className="h-9"
                  onClick={handleInviteMember}
                  disabled={!canManageMembers || !inviteEmail.trim()}
                >
                  Invite
                </Button>
              </div>

              <div className="space-y-2">
                {isMembersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onChange={async (e) => {
                            try {
                              await updateMemberRole(activeWorkspace!.id, member.id, e.target.value as 'owner' | 'admin' | 'member');
                              toast.success('Role updated');
                            } catch (error: any) {
                              toast.error(error.response?.data?.error || 'Failed to update role');
                            }
                          }}
                          className="h-8 text-xs w-28"
                          disabled={!canManageMembers}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </Select>
                        {canManageMembers && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              try {
                                await removeMember(activeWorkspace!.id, member.id);
                                toast.success('Member removed');
                              } catch (error: any) {
                                toast.error(error.response?.data?.error || 'Failed to remove member');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Environment Manager Modal */}
      <Modal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        title="Environment Manager"
        className="max-w-4xl"
      >
        <div className="flex h-[500px] gap-6 mt-4">
          {/* Sidebar */}
          <div className="w-48 flex flex-col gap-2 border-r border-border pr-6">
             <div className="space-y-1">
               {environments.map(env => (
                 <button
                   key={env.id}
                   onClick={() => setActiveEnvironment(env.id === 'globals' ? null : env.id)}
                   className={cn(
                     "w-full text-left px-3 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-tight transition-all",
                     (env.id === activeEnvironmentId || (env.id === 'globals' && !activeEnvironmentId)) 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                   )}
                 >
                   {env.name}
                 </button>
               ))}
             </div>
             <div className="mt-auto pt-4 border-t border-border">
                <div className="flex gap-1">
                  <Input 
                    placeholder="Env Name..." 
                    className="h-8 text-[10px]" 
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEnvName.trim()) {
                        addEnvironment(newEnvName);
                        setNewEnvName('');
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    className="h-8 w-8 min-w-[32px]" 
                    onClick={() => {
                      if (newEnvName.trim()) {
                        addEnvironment(newEnvName);
                        setNewEnvName('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <div>
                   <h3 className="font-extrabold text-xl tracking-tight">{activeEnv?.name}</h3>
                   <p className="text-xs text-muted-foreground">Manage variables for this environment context.</p>
                </div>
                {activeEnv?.id !== 'globals' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10" 
                    onClick={() => deleteEnvironment(activeEnv!.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
             </div>

             <div className="flex-1 overflow-auto bg-muted/20 rounded-2xl border border-border p-6">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 text-[10px] uppercase font-black text-muted-foreground/60 mb-4 px-2 tracking-widest">
                   <div>Variable Name</div>
                   <div>Initial Value</div>
                   <div className="w-9"></div>
                </div>
                <div className="space-y-2">
                  {activeEnv?.variables.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center group animate-in fade-in slide-in-from-top-1">
                      <Input 
                        placeholder="e.g. host" 
                        value={v.key} 
                        onChange={(e) => updateVariable(activeEnv.id, i, { ...v, key: e.target.value })}
                        className="h-10 text-xs font-mono font-bold bg-background focus:ring-primary/20"
                      />
                      <Input 
                        placeholder="Value" 
                        value={v.value} 
                        onChange={(e) => updateVariable(activeEnv.id, i, { ...v, value: e.target.value })}
                        className="h-10 text-xs font-mono bg-background focus:ring-primary/20"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg" 
                        onClick={() => removeVariable(activeEnv.id, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full h-10 border-2 border-dashed border-border hover:bg-primary/5 hover:border-primary/20 text-xs font-extrabold uppercase tracking-wide mt-4 rounded-xl transition-all" 
                    onClick={() => addVariable(activeEnv!.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Variable
                  </Button>
                </div>
             </div>
          </div>
        </div>
      </Modal>
    </header>
  );
}
