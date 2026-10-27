import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UiPermissionService {
  private readonly auth = inject(AuthService);

  has(permission: string): boolean {
    const authorities = this.auth.getAuthorities() ?? [];
    return authorities.includes(permission);
  }

  hasAny(...permissions: string[]): boolean {
    const current = this.auth.getAuthorities() ?? [];
    return permissions.some(p => current.includes(p));
  }
}