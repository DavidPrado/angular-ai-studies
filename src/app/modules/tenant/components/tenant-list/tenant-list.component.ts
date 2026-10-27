import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

import { TenantService } from '../../service/tenant.service';
import { TenantResponse } from '../../models/tenant.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    TranslatePipe,
  ],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
})
export class TenantListComponent implements OnInit {
  private tenantService = inject(TenantService);

  displayedColumns: string[] = [
    'id',
    'name',
    'subdomain',
    'location',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<TenantResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.fetchTenants();
  }

  fetchTenants(): void {
    this.tenantService.findAll().subscribe({
      next: (response) => {
        const data = response.content || response;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.dataSource.filterPredicate = (
          data: TenantResponse,
          filter: string,
        ) => {
          const searchStr = (
            data.name +
            data.subdomain +
            data.id
          ).toLowerCase();
          const statusStr = data.active ? 'ativo' : 'inativo';
          return searchStr.includes(filter) || statusStr.includes(filter);
        };
      },
      error: (err) => console.error('Erro ao carregar tenants', err),
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleStatus(tenant: TenantResponse): void {
    const newStatus = !tenant.active;
    const inactivationReason = newStatus ? '' : 'Bloqueio administrativo via painel';

    this.tenantService.updateStatus(tenant.id, newStatus, inactivationReason).subscribe({
      next: () => this.fetchTenants(),
      error: (err) => console.error('Erro ao alterar status', err),
    });
  }
}
