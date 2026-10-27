import { TenantResponse } from '../../tenant/models/tenant.model';
import { RoleResponse } from '../../roles/models/role.model';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  phoneNumber2: string | null;
  jobTitle: string | null;
  department: string | null;
  costCenter: string | null;
  employeeCode: string | null;
  avatarUrl: string | null;
  status: string | null;
  additionalInfo: string | null;
  active: boolean;
  emailVerified: boolean;
  requirePasswordChange: boolean;
  isTemporary: boolean;
  expiresAt: string | null;
  passwordChangeIntervalDays: number;
  createdAt: string | null;
  loginAttempts: number;
  updatedAt: string | null;
  lastLoginAt: string | null;
  language: string;
  hasProfilePicture: boolean;
  tenant: TenantResponse;
  roles: RoleResponse[];
}

export interface UserRequest {
  email: string;
  fullName: string;
  password?: string;
  tenantId: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  active: boolean;
  requirePasswordChange: boolean;
  roleIds: string[];
  isTemporary: boolean;
  expirationDate?: string | null;
  autoDeactivate: boolean;
  allowedIpAddresses?: string;
  mustChangePassword?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}
