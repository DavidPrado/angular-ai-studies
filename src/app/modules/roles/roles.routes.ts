import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    title: 'Gerenciar Perfis',
    loadComponent: () =>
      import('./components/role-list/role-list.component').then(
        (m) => m.RoleListComponent,
      ),
  },
  {
    path: 'novo',
    title: 'Novo Perfil',
    loadComponent: () =>
      import('./components/role-form/role-form.component').then(
        (m) => m.RoleFormComponent,
      ),
  },
  {
    path: 'editar/:id',
    title: 'Editar Perfil',
    loadComponent: () =>
      import('./components/role-form/role-form.component').then(
        (m) => m.RoleFormComponent,
      ),
  },
];
