
export interface TenantRequest {
  id?: string; // UUID
  name: string;
  subdomain: string;
  country: string;
  currencyCode: string;
  active: boolean;
  blockedAt?: string | Date; 
  inactivationReason?: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  currencyCode: string;
  active: boolean;
  inactivationReason?: string;
  blockedAt?: string | Date;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}