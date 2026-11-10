// ============================================================
// Nexgrid TypeScript Types — derived from FastAPI Pydantic schemas
// ============================================================

// ------------------------------------
// Enums (matching backend enums exactly)
// ------------------------------------
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type BodyType = 'none' | 'json' | 'form_data' | 'x_www_form_urlencoded' | 'raw';

export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';

export type TestCaseCategory =
  | 'positive'
  | 'negative'
  | 'boundary'
  | 'validation'
  | 'authentication'
  | 'authorization';

export type TestResultStatus = 'passed' | 'failed' | 'error' | 'skipped';

export type NotificationType =
  | 'workspace_invite'
  | 'request_updated'
  | 'request_created'
  | 'environment_updated'
  | 'comment_added'
  | 'mention'
  | 'member_joined';

// ------------------------------------
// Auth schemas
// ------------------------------------
export interface UserRegister {
  username: string;      // min 3, max 50
  email: string;
  full_name?: string;    // max 120
  password: string;      // min 8, max 128
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
}

export interface MessageResponse {
  message: string;
}

// ------------------------------------
// Workspace schemas
// ------------------------------------
export interface WorkspaceCreate {
  name: string;
  description?: string | null;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string | null;
}

export interface WorkspaceResponse {
  id: number;
  name: string;
  description?: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface MemberInvite {
  user_id: number;
  role: WorkspaceRole;
}

export interface MemberRoleUpdate {
  role: WorkspaceRole;
}

export interface MemberResponse {
  id: number;
  workspace_id: number;
  user_id: number;
  role: WorkspaceRole;
  joined_at: string;
}

// ------------------------------------
// Collection schemas
// ------------------------------------
export interface CollectionCreate {
  name: string;
  description?: string | null;
}

export interface CollectionUpdate {
  name?: string;
  description?: string | null;
}

export interface CollectionResponse {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------
// Folder schemas
// ------------------------------------
export interface FolderCreate {
  name: string;
  parent_folder_id?: number | null;
  position?: number;
}

export interface FolderUpdate {
  name?: string;
  parent_folder_id?: number | null;
  position?: number;
}

export interface FolderResponse {
  id: number;
  collection_id: number;
  parent_folder_id?: number | null;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

// ------------------------------------
// API Request schemas
// ------------------------------------
export interface ApiRequestCreate {
  name: string;
  description?: string | null;
  method?: HttpMethod;
  url: string;
  query_params?: Record<string, string>;
  headers?: Record<string, string>;
  body_type?: BodyType;
  body?: string | null;
  auth_type?: AuthType;
  auth_config?: Record<string, string>;
  position?: number;
  folder_id?: number | null;
}

export interface ApiRequestUpdate {
  name?: string;
  description?: string | null;
  method?: HttpMethod;
  url?: string;
  query_params?: Record<string, string>;
  headers?: Record<string, string>;
  body_type?: BodyType;
  body?: string | null;
  auth_type?: AuthType;
  auth_config?: Record<string, string>;
  position?: number;
  folder_id?: number | null;
}

export interface ApiRequestResponse {
  id: number;
  collection_id: number;
  folder_id?: number | null;
  name: string;
  description?: string | null;
  method: HttpMethod;
  url: string;
  query_params: Record<string, string>;
  headers: Record<string, string>;
  body_type: BodyType;
  body?: string | null;
  auth_type: AuthType;
  auth_config: Record<string, string>;
  position: number;
  created_by?: number | null;
  locked_by?: number | null;
  locked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResolvedApiRequestResponse extends ApiRequestResponse {
  resolved_url: string;
  resolved_headers: Record<string, string>;
  resolved_body?: string | null;
}

// ------------------------------------
// Environment schemas
// ------------------------------------
export interface EnvironmentCreate {
  name: string;
  is_default?: boolean;
}

export interface EnvironmentUpdate {
  name?: string;
  is_default?: boolean;
}

export interface EnvironmentResponse {
  id: number;
  workspace_id: number;
  name: string;
  is_default: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VariableCreate {
  key: string;
  value?: string | null;
  is_secret?: boolean;
}

export interface VariableUpdate {
  key?: string;
  value?: string | null;
  is_secret?: boolean;
}

export interface VariableResponse {
  id: number;
  environment_id: number;
  key: string;
  value?: string | null;  // "***" when is_secret=true
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentWithVariablesResponse extends EnvironmentResponse {
  variables: VariableResponse[];
}

// ------------------------------------
// Execution schemas
// ------------------------------------
export interface ExecutionTrigger {
  environment_id?: number | null;
}

export interface RequestExecutionResponse {
  id: number;
  request_id: number;
  executed_by?: number | null;
  environment_id?: number | null;
  status_code?: number | null;
  response_time_ms?: number | null;
  response_headers?: Record<string, string> | null;
  response_body?: string | null;
  response_size_bytes?: number | null;
  error_message?: string | null;
  executed_at: string;
}

export interface DirectExecutionRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  query_params?: Record<string, string>;
  body?: string | null;
}

export interface DirectExecutionResponse {
  status_code?: number | null;
  response_time_ms?: number | null;
  response_headers?: Record<string, string> | null;
  response_body?: string | null;
  response_size_bytes?: number | null;
  error_message?: string | null;
}

// ------------------------------------
// Backend error response
// ------------------------------------
export interface ApiError {
  detail: string | { msg: string; type: string }[];
}

// ------------------------------------
// UI-specific types
// ------------------------------------
export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export type TabType = 'params' | 'headers' | 'body' | 'auth' | 'response' | 'history';

export type ThemeMode = 'dark' | 'light';
