import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { CatalogCategoryService } from '../../services/catalog-category.service';
import {
  CatalogItemSummary,
  CategoryResponse,
  ItemStatus,
} from '../../models/catalog.model';
import { UiPermissionService } from '../../../../core/auth/ui-permission.service';
import { BulkExportButtonComponent } from '../../../bulk/components/bulk-export-button/bulk-export-button.component';
import { BulkImportDialogComponent } from '../../../bulk/components/bulk-import-dialog/bulk-import-dialog.component';

/** Níveis de sinalização visual da margem de lucro. */
export type MarginLevel = 'critical' | 'low' | 'medium' | 'high';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    BulkExportButtonComponent,
  ],
  templateUrl: './catalog-list.component.html',
  styleUrl: './catalog-list.component.scss',
})
export class CatalogListComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly categoryService = inject(CatalogCategoryService);
  private readonly uiPerm = inject(UiPermissionService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly filtrosAtuais = () => this.buildParams();
  private readonly basePath = '/v1/catalogo';

  private readonly MARGIN_THRESHOLDS = {
    PRODUCT: { low: 25, high: 45 },
    SERVICE: { low: 40, high: 65 },
  };

  categories: CategoryResponse[] = [];

  filterForm = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    itemType: new FormControl(''),
    categoryId: new FormControl(''),
    sort: new FormControl('createdAt,desc'),
  });

  displayedColumns: string[] = [
    'item',
    'sku',
    'categoria',
    'tipo',
    'status',
    'preco',
    'acoes',
  ];
  dataSource = new MatTableDataSource<CatalogItemSummary>([]);

  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadCategories();
    this.loadItems();
    this.setupFilters();
  }

  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadItems();
      });
  }

  loadCategories(): void {
    this.categoryService.tree(true).subscribe({
      next: (list) => (this.categories = list),
      error: () => (this.categories = []),
    });
  }

  loadItems(): void {
    const filters = this.filterForm.value;
    const cleanFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined)
          acc[key] = value;
        return acc;
      },
      {} as Record<string, any>,
    );

    const params = {
      page: this.pageIndex.toString(),
      size: this.pageSize.toString(),
      sort: 'createdAt,desc',
      ...cleanFilters,
    };

    this.catalogService.list(params).subscribe({
      next: (res) => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
      },
      error: (err) => {
        this.snack.open('Erro ao carregar o catálogo.', 'Fechar', {
          duration: 3000,
        });
        console.error(err);
      },
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      itemType: '',
      categoryId: '',
      sort: 'createdAt,desc',
    });
  }

  addItem(): void {
    this.router.navigate([this.basePath, 'novo']);
  }

  editItem(item: CatalogItemSummary): void {
    this.router.navigate([this.basePath, 'editar', item.id]);
  }

  /** DD-10: confirmação com resumo do efeito da ação. */
  toggleStatus(item: CatalogItemSummary): void {
    const target: ItemStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const msg =
      target === 'ACTIVE'
        ? `Ativar "${item.name}"? Ele passará a aparecer em vendas e compras.`
        : `Desativar "${item.name}"? Ele sairá das buscas de venda, mas o histórico é preservado.`;

    if (confirm(msg)) {
      this.catalogService.changeStatus(item.id, target).subscribe({
        next: () => {
          this.snack.open(
            target === 'ACTIVE' ? 'Item ativado!' : 'Item desativado.',
            'OK',
            { duration: 2500 },
          );
          this.loadItems();
        },
        error: (err) =>
          this.snack.open(
            err?.error?.message ?? 'Erro ao alterar o status.',
            'Fechar',
            {
              duration: 4000,
            },
          ),
      });
    }
  }

  deleteItem(item: CatalogItemSummary): void {
    const msg = `Excluir "${item.name}" (${item.sku})? Ele sairá das buscas; vendas antigas são preservadas.`;
    if (confirm(msg)) {
      this.catalogService.remove(item.id).subscribe({
        next: () => {
          this.snack.open('Item excluído.', 'OK', { duration: 2500 });
          this.loadItems();
        },
        error: (err) =>
          this.snack.open(
            err?.error?.message ?? 'Erro ao excluir o item.',
            'Fechar',
            {
              duration: 4000,
            },
          ),
      });
    }
  }

  // ── RBAC de UI ─────────────────────────────────────────────
  canWrite(): boolean {
    return this.uiPerm.has('catalog:write');
  }

  canDelete(): boolean {
    return this.uiPerm.has('catalog:delete');
  }

  // ── Rótulos amigáveis (DD-09: glossário vivo) ───────────────
  statusLabel(s: ItemStatus): string {
    return { DRAFT: 'Rascunho', ACTIVE: 'Ativo', INACTIVE: 'Inativo' }[s];
  }

  typeLabel(t: string): string {
    return t === 'SERVICE' ? 'Serviço' : 'Produto';
  }

  // ── Margem de lucro com sinalização visual ─────────────────

  /**
   * Classifica a margem em 4 níveis. Os thresholds diferem entre
   * produto e serviço (serviços têm margem estruturalmente maior).
   */
  marginLevel(item: CatalogItemSummary): MarginLevel {
    const m = item.marginPercent;
    if (m <= 0) return 'critical';

    const th =
      item.itemType === 'SERVICE'
        ? this.MARGIN_THRESHOLDS.SERVICE
        : this.MARGIN_THRESHOLDS.PRODUCT;

    if (m < th.low) return 'low';
    if (m <= th.high) return 'medium';
    return 'high';
  }

  /** Tooltip explicativo da faixa (linguagem de gente). */
  marginLabel(item: CatalogItemSummary): string {
    const level = this.marginLevel(item);
    const th =
      item.itemType === 'SERVICE'
        ? this.MARGIN_THRESHOLDS.SERVICE
        : this.MARGIN_THRESHOLDS.PRODUCT;
    const tipo = item.itemType === 'SERVICE' ? 'serviço' : 'produto';

    switch (level) {
      case 'critical':
        return `Margem negativa ou zero — revise o preço! (${tipo})`;
      case 'low':
        return `Margem baixa para ${tipo} (ideal: ${th.low}% ou mais)`;
      case 'medium':
        return `Margem saudável para ${tipo} (${th.low}–${th.high}%)`;
      case 'high':
        return `Margem premium para ${tipo} (acima de ${th.high}%)`;
    }
  }

  /** Ícone que reforça a cor (acessibilidade para daltônicos). */
  marginIcon(item: CatalogItemSummary): string {
    switch (this.marginLevel(item)) {
      case 'critical':
        return 'warning';
      case 'low':
        return 'trending_down';
      case 'medium':
        return 'trending_flat';
      case 'high':
        return 'trending_up';
    }
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadItems();
  }

  buildParams(): Record<string, string> {
    const clean = Object.entries(this.filterForm.value).reduce(
      (acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    );
    return { ...clean, sort: clean['sort'] ?? 'createdAt,desc' };
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(BulkImportDialogComponent, {
      width: '450px',
      disableClose: true,
      panelClass: 'custom-dialog-container', 
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
       
        this.snack
          .open(
            'Acompanhe o progresso na Central de Operações',
            'Ir para Operações',
            {
              duration: 6000,
              panelClass: 'snack-success',
            },
          )
          .onAction()
          .subscribe(() => {
            this.router.navigate(['/v1/operacoes']);
          });
      }
    });
  }
}
