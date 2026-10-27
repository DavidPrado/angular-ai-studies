// src/app/core/guards/permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permission = route.data?.['permission'] as string | undefined;

  const authorities = auth.getAuthorities();
  console.log('🔐 permissionGuard:', {
    route: route.url?.toString() || 'unknown',
    required: permission,
    current: authorities,
  });

  if (!permission) return true;

  if (authorities.includes(permission)) {
    return true;
  }

  console.warn(`⛔ Acesso negado: precisa de '${permission}', tem:`, authorities);
  return router.createUrlTree(['/v1']);
};