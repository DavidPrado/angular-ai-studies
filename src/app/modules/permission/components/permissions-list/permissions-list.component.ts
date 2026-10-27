import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PermissionService } from '../../service/permission.service';
import { PermissionDetailResponse } from '../../model/permission.model';

interface PermissionGroup {
  category: string;
  items: PermissionDetailResponse[];
}

@Component({
  selector: 'app-permissions-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './permissions-list.component.html',
  styleUrl: './permissions-list.component.scss',
})
export class PermissionsListComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private snack = inject(MatSnackBar);

  permissions: PermissionDetailResponse[] = [];
  filter = '';
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.permissionService.list().subscribe({
      next: (list) => {
        this.permissions = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Erro ao carregar permissões.', 'Fechar', { duration: 3000 });
      },
    });
  }

  onFilterChange(event: Event): void {
    this.filter = (event.target as HTMLInputElement).value;
  }

  get filtered(): PermissionDetailResponse[] {
    const term = this.filter.trim().toLowerCase();
    if (!term) return this.permissions;
    return this.permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term) ||
        (p.category ?? '').toLowerCase().includes(term)
    );
  }

  get grouped(): PermissionGroup[] {
    const map = new Map<string, PermissionDetailResponse[]>();
    for (const p of this.filtered) {
      const cat = p.category ?? 'GERAL';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return [...map.entries()]
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  get totalCount(): number {
    return this.permissions.length;
  }
}