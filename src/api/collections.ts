/**
 * Collections API — /api/workspaces/{id}/collections and /api/collections/*
 * Folders API — /api/collections/{id}/folders and /api/folders/*
 */
import apiClient from './client';
import type {
  CollectionCreate,
  CollectionUpdate,
  CollectionResponse,
  FolderCreate,
  FolderUpdate,
  FolderResponse,
} from '../types';

export const collectionsApi = {
  // Collections
  create: (workspaceId: number, data: CollectionCreate) =>
    apiClient.post<CollectionResponse>(
      `/api/workspaces/${workspaceId}/collections`,
      data
    ),

  list: (workspaceId: number) =>
    apiClient.get<CollectionResponse[]>(
      `/api/workspaces/${workspaceId}/collections`
    ),

  get: (collectionId: number) =>
    apiClient.get<CollectionResponse>(`/api/collections/${collectionId}`),

  update: (collectionId: number, data: CollectionUpdate) =>
    apiClient.patch<CollectionResponse>(`/api/collections/${collectionId}`, data),

  delete: (collectionId: number) =>
    apiClient.delete(`/api/collections/${collectionId}`),

  // Folders
  createFolder: (collectionId: number, data: FolderCreate) =>
    apiClient.post<FolderResponse>(
      `/api/collections/${collectionId}/folders`,
      data
    ),

  listFolders: (collectionId: number) =>
    apiClient.get<FolderResponse[]>(`/api/collections/${collectionId}/folders`),

  getFolder: (folderId: number) =>
    apiClient.get<FolderResponse>(`/api/folders/${folderId}`),

  updateFolder: (folderId: number, data: FolderUpdate) =>
    apiClient.patch<FolderResponse>(`/api/folders/${folderId}`, data),

  deleteFolder: (folderId: number) =>
    apiClient.delete(`/api/folders/${folderId}`),
};
