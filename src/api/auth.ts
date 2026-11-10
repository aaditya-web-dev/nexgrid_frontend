/**
 * Auth API — POST /api/auth/register, login, refresh, me
 */
import apiClient from './client';
import type {
  UserRegister,
  UserLogin,
  RefreshTokenRequest,
  TokenResponse,
  UserResponse,
} from '../types';

export const authApi = {
  register: (data: UserRegister) =>
    apiClient.post<UserResponse>('/api/auth/register', data),

  login: (data: UserLogin) =>
    apiClient.post<TokenResponse>('/api/auth/login', data),

  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<TokenResponse>('/api/auth/refresh', data),

  me: () =>
    apiClient.get<UserResponse>('/api/auth/me'),
};
