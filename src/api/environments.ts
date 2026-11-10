/**
 * Environments API — /api/workspaces/{id}/environments and /api/environments/*
 * Variables API — /api/environments/{id}/variables and /api/variables/*
 */
import apiClient from './client';
import type {
  EnvironmentCreate,
  EnvironmentUpdate,
  EnvironmentResponse,
  EnvironmentWithVariablesResponse,
  VariableCreate,
  VariableUpdate,
  VariableResponse,
} from '../types';

export const environmentsApi = {
  create: (workspaceId: number, data: EnvironmentCreate) =>
    apiClient.post<EnvironmentResponse>(
      `/api/workspaces/${workspaceId}/environments`,
      data
    ),

  list: (workspaceId: number) =>
    apiClient.get<EnvironmentResponse[]>(
      `/api/workspaces/${workspaceId}/environments`
    ),

  get: (environmentId: number) =>
    apiClient.get<EnvironmentWithVariablesResponse>(
      `/api/environments/${environmentId}`
    ),

  update: (environmentId: number, data: EnvironmentUpdate) =>
    apiClient.patch<EnvironmentResponse>(
      `/api/environments/${environmentId}`,
      data
    ),

  delete: (environmentId: number) =>
    apiClient.delete(`/api/environments/${environmentId}`),

  // Variables
  addVariable: (environmentId: number, data: VariableCreate) =>
    apiClient.post<VariableResponse>(
      `/api/environments/${environmentId}/variables`,
      data
    ),

  listVariables: (environmentId: number) =>
    apiClient.get<VariableResponse[]>(
      `/api/environments/${environmentId}/variables`
    ),

  updateVariable: (variableId: number, data: VariableUpdate) =>
    apiClient.patch<VariableResponse>(`/api/variables/${variableId}`, data),

  deleteVariable: (variableId: number) =>
    apiClient.delete(`/api/variables/${variableId}`),
};
