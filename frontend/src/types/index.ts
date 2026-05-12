export interface User {
  id: string;
  email: string;
  name: string;
  defaultWorkspaceId?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, any> | string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface Collection {
  id: string;
  workspaceId?: string | null;
  name: string;
  description?: string;
  shareId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  endpoints?: Endpoint[];
  _count?: {
    endpoints: number;
  };
}

export interface RequestTest {
  name?: string;
  path: string;
  operator: string;
  value: string;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyKey?: string;
  apiKeyValue?: string;
  apiKeyIn?: 'header' | 'query';
  apiKeyHeaderName?: string;
}

export interface Endpoint {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body?: string;
  bodyType: BodyType;
  auth?: AuthConfig | null;
  formFields?: KeyValuePair[] | null;
  preRequestScript?: string | null;
  postRequestScript?: string | null;
  tests?: RequestTest[] | string | null;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';
export type BodyType =
  | 'json'
  | 'form-data'
  | 'x-www-form-urlencoded'
  | 'raw'
  | 'none';

export interface RequestHistory {
  id: string;
  method: string;
  url: string;
  headers?: KeyValuePair[];
  body?: string;
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  responseTime?: number;
  createdAt: string;
  endpoint?: {
    name: string;
  };
}

export interface ApiResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  responseTime?: number;
  requestId?: string;
  tests?: {
    passed: number;
    failed: number;
    results: unknown[];
  };
  scripts?: {
    preRequest?: { error?: string | null };
    postRequest?: { error?: string | null };
  };
  error?: {
    message: string;
    code?: string;
  };
}
