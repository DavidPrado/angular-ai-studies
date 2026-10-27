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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { RoleSummary } from '../../models/role.model';
import { UiPermissionService } from '../../../../core/auth/ui-permission.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly uiPerm = inject(UiPermissionService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  filterForm = new FormGroup({
    search: new FormControl(''),
    systemDefault: new FormControl(''),
  });

  displayedColumns: string[] = [
    'perfil',
    'nomeTecnico',
    'permissoes',
    'tipo',
    'acoes',
  ];
  dataSource = new MatTableDataSource<RoleSummary>([]);

  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadRoles();
    this.setupFilters();
  }

  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadRoles();
      });
  }

  loadRoles(): void {
    const filters = this.filterForm.value;

    const cleanFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    // 'search' da UI → parâmetro 'name' do backend (casa name E displayName)
    if (cleanFilters['search']) {
      cleanFilters['name'] = cleanFilters['search'];
      delete cleanFilters['search'];
    }

    const params = {
      page: this.pageIndex.toString(),
      size: this.pageSize.toString(),
      sort: 'name,asc',
      ...cleanFilters,
    };

    this.roleService.list(params).subscribe({
      next: (res) => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
      },
      error: (err) => {
        this.snack.open('Erro ao carregar perfis.', 'Fechar', { duration: 3000 });
        console.error(err);
      },
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', systemDefault: '' });
  }

  addRole(): void {
    this.router.navigate(['/v1/admin/perfis/novo']);
  }

  editRole(role: RoleSummary): void {
    this.router.navigate(['/v1/admin/perfis/editar', role.id]);
  }

  deleteRole(role: RoleSummary): void {
    const label = role.displayName || role.name;
    if (confirm(`Deseja realmente excluir o perfil ${label}?`)) {
      this.roleService.remove(role.id).subscribe({
        next: () => {
          this.snack.open('Perfil removido com sucesso!', 'OK', { duration: 3000 });
          this.loadRoles();
        },
        error: (err) =>
          this.snack.open(err?.error?.message ?? 'Erro ao excluir perfil.', 'Fechar', {
            duration: 4000,
          }),
      });
    }
  }

  // ── RBAC de UI ─────────────────────────────────────────────
  canWrite(): boolean {
    return this.uiPerm.has('roles:write');
  }

  isDeletable(role: RoleSummary): boolean {
    return !role.isSystemDefault && this.uiPerm.has('roles:delete');
  }

  deleteTooltip(role: RoleSummary): string {
    if (role.isSystemDefault) return 'Perfil do sistema não pode ser excluído';
    if (!this.uiPerm.has('roles:delete')) return 'Sem permissão para excluir';
    return 'Excluir';
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadRoles();
  }
}