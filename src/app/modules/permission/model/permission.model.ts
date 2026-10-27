export interface PermissionDetailResponse {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

export interface PermissionResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}