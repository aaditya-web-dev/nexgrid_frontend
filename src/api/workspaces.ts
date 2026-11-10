/**
 * Workspaces API — /api/workspaces/*
 */
import apiClient from './client';
import type {
  WorkspaceCreate,
  WorkspaceUpdate,
  WorkspaceResponse,
  MemberInvite,
  MemberRoleUpdate,
  MemberResponse,
} from '../types';

export const workspacesApi = {
  create: (data: WorkspaceCreate) =>
    apiClient.post<WorkspaceResponse>('/api/workspaces', data),

  list: () =>
    apiClient.get<WorkspaceResponse[]>('/api/workspaces'),

  get: (workspaceId: number) =>
    apiClient.get<WorkspaceResponse>(`/api/workspaces/${workspaceId}`),

  update: (workspaceId: number, data: WorkspaceUpdate) =>
    apiClient.patch<WorkspaceResponse>(`/api/workspaces/${workspaceId}`, data),

  delete: (workspaceId: number) =>
    apiClient.delete(`/api/workspaces/${workspaceId}`),

  // Members
  listMembers: (workspaceId: number) =>
    apiClient.get<MemberResponse[]>(`/api/workspaces/${workspaceId}/members`),

  inviteMember: (workspaceId: number, data: MemberInvite) =>
    apiClient.post<MemberResponse>(`/api/workspaces/${workspaceId}/members`, data),

  updateMemberRole: (workspaceId: number, userId: number, data: MemberRoleUpdate) =>
    apiClient.patch<MemberResponse>(
      `/api/workspaces/${workspaceId}/members/${userId}`,
      data
    ),

  removeMember: (workspaceId: number, userId: number) =>
    apiClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`),
};
