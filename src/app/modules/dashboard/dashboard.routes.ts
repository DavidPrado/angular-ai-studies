import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('../admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'catalogo',
    loadChildren: () =>
      import('../catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'operacoes',                  
    loadChildren: () =>
      import('../bulk/bulk.routes').then((m) => m.BULK_ROUTES),
  },
];
