import { Routes } from '@angular/router';

export const BULK_ROUTES: Routes = [
  {
    path: '',
    title: 'Central de Operações',
    loadComponent: () =>
      import('./components/bulk-operations-center/bulk-operations-center.component').then(
        (m) => m.BulkOperationsCenterComponent,
      ),
  },
];