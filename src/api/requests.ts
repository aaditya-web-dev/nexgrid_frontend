/**
 * API Requests — /api/collections/{id}/requests and /api/requests/*
 * Includes execution endpoints
 */
import apiClient from './client';
import type {
  ApiRequestCreate,
  ApiRequestUpdate,
  ApiRequestResponse,
  ResolvedApiRequestResponse,
  RequestExecutionResponse,
  DirectExecutionRequest,
  DirectExecutionResponse,
} from '../types';

export const requestsApi = {
  create: (collectionId: number, data: ApiRequestCreate) =>
    apiClient.post<ApiRequestResponse>(
      `/api/collections/${collectionId}/requests`,
      data
    ),

  list: (collectionId: number, folderId?: number | null) => {
    const params: Record<string, string> = {};
    if (folderId !== null && folderId !== undefined) {
      params.folder_id = String(folderId);
    }
    return apiClient.get<ApiRequestResponse[]>(
      `/api/collections/${collectionId}/requests`,
      { params }
    );
  },

  get: (requestId: number) =>
    apiClient.get<ApiRequestResponse>(`/api/requests/${requestId}`),

  resolve: (requestId: number, environmentId?: number | null) => {
    const params: Record<string, string> = {};
    if (environmentId !== null && environmentId !== undefined) {
      params.environment_id = String(environmentId);
    }
    return apiClient.get<ResolvedApiRequestResponse>(
      `/api/requests/${requestId}/resolve`,
      { params }
    );
  },

  update: (requestId: number, data: ApiRequestUpdate) =>
    apiClient.patch<ApiRequestResponse>(`/api/requests/${requestId}`, data),

  delete: (requestId: number) =>
    apiClient.delete(`/api/requests/${requestId}`),

  // Execution
  execute: (requestId: number, environmentId?: number | null, timeoutSeconds?: number) => {
    const params: Record<string, string> = {};
    if (environmentId !== null && environmentId !== undefined) {
      params.environment_id = String(environmentId);
    }
    if (timeoutSeconds !== undefined) {
      params.timeout_seconds = String(timeoutSeconds);
    }
    return apiClient.post<RequestExecutionResponse>(
      `/api/requests/${requestId}/execute`,
      {},
      { params }
    );
  },

  listExecutions: (requestId: number, limit?: number) =>
    apiClient.get<RequestExecutionResponse[]>(
      `/api/requests/${requestId}/executions`,
      { params: limit ? { limit: String(limit) } : {} }
    ),

  getExecution: (executionId: number) =>
    apiClient.get<RequestExecutionResponse>(`/api/executions/${executionId}`),

  quickRun: (data: DirectExecutionRequest, timeoutSeconds?: number) => {
    const params: Record<string, string> = {};
    if (timeoutSeconds !== undefined) {
      params.timeout_seconds = String(timeoutSeconds);
    }
    return apiClient.post<DirectExecutionResponse>(
      '/api/requests/quick-run',
      data,
      { params }
    );
  },
};
