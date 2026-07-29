/**
 * API response envelope types — YakinLulus.id
 * Standard wrapper for all backend responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface BulkCreateRequest<T> {
  items: T[];
}

export interface BulkCreateResponse<T> {
  created: T[];
  failed: { item: T; error: string }[];
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkDeleteResponse {
  deleted_count: number;
  failed_ids: string[];
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}
