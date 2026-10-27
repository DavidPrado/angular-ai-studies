import { PermissionResponse  } from '../../../modules/permission/model/permission.model';

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  displayName: string | null;
  isSystemDefault: boolean;
  permissionCount: number;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  displayName: string | null;
  isSystemDefault: boolean;
  permissions: PermissionResponse[];
}

export interface RoleRequest {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}

export interface RoleUpdateRequest {
  displayName: string;
  description?: string;
  permissionIds: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}