import { Routes } from '@angular/router';

export const TENANT_ROUTES: Routes = [
  {
    path: '',
    title: 'Gerenciar Tenants',
    loadComponent: () =>
      import('./components/tenant-list/tenant-list.component').then(
        (m) => m.TenantListComponent
      ),
  },
  {
    path: 'novo',
    title: 'Novo Tenant',
    loadComponent: () =>
      import('./components/tenant-form/tenant-form.component').then(
        (m) => m.TenantFormComponent
      ),
  },
  {
    path: 'editar/:id',
    title: 'Editar Tenant',
    loadComponent: () =>
      import('./components/tenant-form/tenant-form.component').then(
        (m) => m.TenantFormComponent
      ),
  },
];