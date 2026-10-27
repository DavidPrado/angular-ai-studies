export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  type: string;
  expiresIn: number;
  userName: string;     
  roles: string[];      
  tenantId: string;    
}

export interface UserInfo {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
}