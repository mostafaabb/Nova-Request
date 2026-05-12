import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { workspaceApi } from '@/lib/api';
import {
  Workspace,
  WorkspaceMember,
  WorkspacePendingInvite,
  MyWorkspaceInvitation,
  AuditLog,
} from '@/types';

interface AddMemberResult {
  member?: WorkspaceMember;
  invitation?: {
    id: string;
    email: string;
    role: string;
    expiresAt: string;
    createdAt: string;
  };
  message?: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  members: WorkspaceMember[];
  workspacePendingInvites: WorkspacePendingInvite[];
  myInvitations: MyWorkspaceInvitation[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  isMembersLoading: boolean;
  isWorkspaceInvitesLoading: boolean;
  isMyInvitationsLoading: boolean;
  isAuditLoading: boolean;

  fetchWorkspaces: (defaultWorkspaceId?: string) => Promise<void>;
  setActiveWorkspace: (id: string | null) => void;
  createWorkspace: (name: string) => Promise<void>;
  fetchMembers: (workspaceId: string) => Promise<void>;
  fetchWorkspacePendingInvites: (workspaceId: string) => Promise<void>;
  revokeWorkspaceInvite: (workspaceId: string, inviteId: string) => Promise<void>;
  fetchMyInvitations: () => Promise<void>;
  acceptInvitation: (token: string) => Promise<{ workspaceId: string; workspaceName: string }>;
  inviteMember: (workspaceId: string, email: string, role: 'owner' | 'admin' | 'member') => Promise<AddMemberResult>;
  updateMemberRole: (
    workspaceId: string,
    memberId: string,
    role: 'owner' | 'admin' | 'member'
  ) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  fetchAuditLogs: (workspaceId: string, params?: { limit?: number; offset?: number }) => Promise<void>;
}

const setWorkspaceStorage = (workspaceId: string | null) => {
  if (typeof window === 'undefined') return;
  if (workspaceId) {
    localStorage.setItem('nova-active-workspace', workspaceId);
  } else {
    localStorage.removeItem('nova-active-workspace');
  }
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      members: [],
      workspacePendingInvites: [],
      myInvitations: [],
      auditLogs: [],
      isLoading: false,
      isMembersLoading: false,
      isWorkspaceInvitesLoading: false,
      isMyInvitationsLoading: false,
      isAuditLoading: false,

      fetchWorkspaces: async (defaultWorkspaceId) => {
        set({ isLoading: true });
        try {
          const response = await workspaceApi.getAll();
          const workspaces: Workspace[] = response.data.workspaces;
          const currentActive = get().activeWorkspaceId;
          let nextActive = currentActive;

          if (!nextActive || !workspaces.find((w) => w.id === nextActive)) {
            nextActive = defaultWorkspaceId || workspaces[0]?.id || null;
          }

          setWorkspaceStorage(nextActive);
          set({ workspaces, activeWorkspaceId: nextActive, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setActiveWorkspace: (id) => {
        setWorkspaceStorage(id);
        set({ activeWorkspaceId: id });
      },

      createWorkspace: async (name) => {
        const response = await workspaceApi.create({ name });
        const workspace: Workspace = response.data.workspace;

        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          activeWorkspaceId: workspace.id,
        }));
        setWorkspaceStorage(workspace.id);
      },

      fetchMembers: async (workspaceId) => {
        set({ isMembersLoading: true });
        try {
          const response = await workspaceApi.getMembers(workspaceId);
          set({ members: response.data.members, isMembersLoading: false });
        } catch (error) {
          set({ isMembersLoading: false });
          throw error;
        }
      },

      fetchWorkspacePendingInvites: async (workspaceId) => {
        set({ isWorkspaceInvitesLoading: true });
        try {
          const response = await workspaceApi.getWorkspaceInvites(workspaceId);
          set({
            workspacePendingInvites: response.data.invitations,
            isWorkspaceInvitesLoading: false,
          });
        } catch (error) {
          set({ isWorkspaceInvitesLoading: false });
          throw error;
        }
      },

      revokeWorkspaceInvite: async (workspaceId, inviteId) => {
        await workspaceApi.revokeWorkspaceInvite(workspaceId, inviteId);
        set((state) => ({
          workspacePendingInvites: state.workspacePendingInvites.filter((i) => i.id !== inviteId),
        }));
      },

      fetchMyInvitations: async () => {
        set({ isMyInvitationsLoading: true });
        try {
          const response = await workspaceApi.getMyInvitations();
          set({ myInvitations: response.data.invitations, isMyInvitationsLoading: false });
        } catch (error) {
          set({ isMyInvitationsLoading: false });
          throw error;
        }
      },

      acceptInvitation: async (token) => {
        const response = await workspaceApi.acceptInvitation(token);
        await get().fetchWorkspaces();
        await get().fetchMyInvitations();
        return {
          workspaceId: response.data.workspaceId as string,
          workspaceName: response.data.workspaceName as string,
        };
      },

      inviteMember: async (workspaceId, email, role) => {
        const response = await workspaceApi.addMember(workspaceId, { email, role });
        const data = response.data as AddMemberResult;

        if (data.member) {
          set((state) => ({
            members: [...state.members, data.member!],
          }));
          await get().fetchWorkspacePendingInvites(workspaceId);
        }

        if (data.invitation) {
          await get().fetchWorkspacePendingInvites(workspaceId);
        }

        return data;
      },

      updateMemberRole: async (workspaceId, memberId, role) => {
        const response = await workspaceApi.updateMemberRole(workspaceId, memberId, { role });
        set((state) => ({
          members: state.members.map((member) =>
            member.id === memberId ? response.data.member : member
          ),
        }));
      },

      removeMember: async (workspaceId, memberId) => {
        await workspaceApi.removeMember(workspaceId, memberId);
        set((state) => ({
          members: state.members.filter((member) => member.id !== memberId),
        }));
      },

      fetchAuditLogs: async (workspaceId, params) => {
        set({ isAuditLoading: true });
        try {
          const response = await workspaceApi.getAuditLogs(workspaceId, params);
          set({ auditLogs: response.data.logs, isAuditLoading: false });
        } catch (error) {
          set({ isAuditLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
);
