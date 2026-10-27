import { Routes } from '@angular/router';

export const PERMISSION_ROUTES: Routes = [
  {
    path: '',
    title: 'Permissões',
    loadComponent: () =>
      import('./components/permissions-list/permissions-list.component').then(
        (m) => m.PermissionsListComponent
      ),
  },
];