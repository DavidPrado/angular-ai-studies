import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleService } from '../../services/role.service';
import { PermissionService } from '../../../permission/service/permission.service';
import { PermissionDetailResponse } from '../../../permission/model/permission.model';

interface PermissionGroup {
  category: string;
  items: PermissionDetailResponse[];
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  roleForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    name: [''],
    description: [''],
  });

  isEditMode = false;
  roleId: string | null = null;

  permissions: PermissionDetailResponse[] = [];
  permissionFilter = '';
  selected = new Set<string>();

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;

    // Nome técnico é obrigatório só na criação (edição não envia name)
    const nameControl = this.roleForm.get('name');
    if (this.isEditMode) {
      nameControl?.clearValidators();
    } else {
      nameControl?.setValidators([Validators.required]);
    }

    this.loadPermissions();
    if (this.isEditMode) this.loadRole(this.roleId!);
  }

  private loadPermissions(): void {
    this.permissionService.list().subscribe({
      next: (list) => (this.permissions = list),
      error: () =>
        this.snack.open('Erro ao carregar permissões.', 'Fechar', {
          duration: 3000,
        }),
    });
  }

  private loadRole(id: string): void {
    this.roleService.getById(id).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          displayName: role.displayName ?? '',
          name: role.name,
          description: role.description ?? '',
        });
        this.selected = new Set((role.permissions ?? []).map((p) => p.id));
      },
      error: () =>
        this.snack.open('Erro ao carregar o perfil.', 'Fechar', {
          duration: 3000,
        }),
    });
  }

  // ── Matriz de permissões ─────────────────────────────────────
  onFilterChange(event: Event): void {
    this.permissionFilter = (event.target as HTMLInputElement).value;
  }

  get filteredPermissions(): PermissionDetailResponse[] {
    const term = this.permissionFilter.trim().toLowerCase();
    if (!term) return this.permissions;
    return this.permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term),
    );
  }

  get groupedPermissions(): PermissionGroup[] {
    const map = new Map<string, PermissionDetailResponse[]>();
    for (const p of this.filteredPermissions) {
      const cat = p.category ?? 'GERAL';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return [...map.entries()]
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  get selectedCount(): number {
    return this.selected.size;
  }

  get canSave(): boolean {
    return this.roleForm.valid && this.selected.size > 0;
  }

  isSelected(id: string): boolean {
    return this.selected.has(id);
  }

  togglePermission(id: string, checked: boolean): void {
    if (checked) this.selected.add(id);
    else this.selected.delete(id);
    this.selected = new Set(this.selected);
  }

  // ── Ações por grupo visível (respeita o filtro de busca) ─────
  allSelectedIn(items: PermissionDetailResponse[]): boolean {
    return items.length > 0 && items.every((p) => this.selected.has(p.id));
  }

  indeterminateIn(items: PermissionDetailResponse[]): boolean {
    const some = items.some((p) => this.selected.has(p.id));
    return some && !this.allSelectedIn(items);
  }

  toggleItems(items: PermissionDetailResponse[], checked: boolean): void {
    for (const p of items) {
      if (checked) this.selected.add(p.id);
      else this.selected.delete(p.id);
    }
    this.selected = new Set(this.selected);
  }

  countSelectedIn(items: PermissionDetailResponse[]): number {
    return items.filter((p) => this.selected.has(p.id)).length;
  }

  // ── Nome técnico sugerido (só criação) ───────────────────────
  suggestTechnicalName(): void {
    if (this.isEditMode) return;
    const display = (this.roleForm.get('displayName')?.value ?? '') as string;
    this.roleForm.get('name')?.setValue(this.toTechnicalName(display));
  }

  private toTechnicalName(display: string): string {
    return (
      'ROLE_' +
      display
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    );
  }

  // ── Ações ────────────────────────────────────────────────────
  cancel(): void {
    this.router.navigate(['/v1/admin/perfis']);
  }

  onSubmit(): void {
    if (!this.canSave) {
      this.roleForm.markAllAsTouched();
      if (this.selected.size === 0) {
        this.snack.open('Selecione ao menos uma permissão.', 'Fechar', {
          duration: 3000,
        });
      }
      return;
    }

    const v = this.roleForm.value;
    const permissionIds = [...this.selected];

    const request$ = this.isEditMode
      ? this.roleService.update(this.roleId!, {
          displayName: v.displayName!,
          description: v.description ?? '',
          permissionIds,
        })
      : this.roleService.create({
          name: (v.name ?? '').trim(),
          displayName: v.displayName!,
          description: v.description ?? '',
          permissionIds,
        });

    request$.subscribe({
      next: () => {
        this.snack.open('Perfil salvo com sucesso!', 'OK', { duration: 2500 });
        this.cancel();
      },
      error: (err) =>
        this.snack.open(
          err?.error?.message ?? 'Erro ao salvar o perfil.',
          'Fechar',
          {
            duration: 4000,
          },
        ),
    });
  }
}
