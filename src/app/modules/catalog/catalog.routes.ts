import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    title: 'Catálogo de Produtos e Serviços',
    loadComponent: () =>
      import('./components/catalog-list/catalog-list.component').then(
        (m) => m.CatalogListComponent,
      ),
  },
  {
    path: 'novo',
    title: 'Novo Item do Catálogo',
    loadComponent: () =>
      import('./components/catalog-form/catalog-form.component').then(
        (m) => m.CatalogFormComponent,
      ),
  },
  {
    path: 'editar/:id',
    title: 'Editar Item do Catálogo',
    loadComponent: () =>
      import('./components/catalog-form/catalog-form.component').then(
        (m) => m.CatalogFormComponent,
      ),
  },
  {
    path: 'categorias',
    title: 'Categorias do Catálogo',
    loadComponent: () =>
      import('./components/catalog-categories/catalog-categories.component').then(
        (m) => m.CatalogCategoriesComponent,
      ),
  },
  {
    path: 'manual',
    title: 'Manual do Catálogo - Ajuda',
    loadComponent: () =>
      import('./components/catalog-manual/catalog-manual.component').then(
        (m) => m.CatalogManualComponent,
      ),
  },
];
