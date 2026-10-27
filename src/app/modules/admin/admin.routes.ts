import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'usuarios',
    canActivate: [permissionGuard],
    data: { permission: 'users:read' },
    loadChildren: () =>
      import('../users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'tenants',
    canActivate: [permissionGuard],
    data: { permission: 'tenants:read' },
    loadChildren: () =>
      import('../tenant/tenant.routes').then((m) => m.TENANT_ROUTES),
  },
  {
    path: 'perfis',
    canActivate: [permissionGuard],
    data: { permission: 'roles:read' },
    loadChildren: () =>
      import('../roles/roles.routes').then((m) => m.ROLES_ROUTES),
  },
  {
    path: 'permissoes',
    canActivate: [permissionGuard],
    data: { permission: 'roles:read' },
    loadChildren: () =>
      import('../permission/permission.routes').then(
        (m) => m.PERMISSION_ROUTES,
      ),
  },
  {
    path: 'catalogo',
    loadChildren: () =>
      import('../catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
];
