import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogCategoryService } from '../../services/catalog-category.service';
import {
  AppliesTo,
  AttributeDefRequest,
  AttributeDefResponse,
  CategoryRequest,
  CategoryResponse,
  DataType,
  Vertical,
} from '../../models/catalog.model';

/** Linha da árvore: categoria + nível de indentação. */
interface CategoryRow {
  cat: CategoryResponse;
  level: number;
}

@Component({
  selector: 'app-catalog-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './catalog-categories.component.html',
  styleUrl: './catalog-categories.component.scss',
})
export class CatalogCategoriesComponent implements OnInit {
  private readonly categoryService = inject(CatalogCategoryService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  categories: CategoryResponse[] = [];
  rows: CategoryRow[] = [];
  filter = '';

  // ── Filtros / ordenação da árvore ──────────────────────────
  /** '' = todas | 'active' = somente ativas | 'inactive' = somente inativas */
  statusFilter: '' | 'active' | 'inactive' = '';
  verticalFilter = '';
  sortBy: 'name' | 'items' = 'name';

  selected: CategoryResponse | null = null;
  mode: 'create' | 'edit' | null = null;
  saving = false;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentId: [''],
    vertical: ['GENERIC' as Vertical, [Validators.required]],
    active: [true],
  });

  // ── Campos extras (defs) ───────────────────────────────────
  defs: AttributeDefResponse[] = [];
  showDefEditor = false;
  defForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(2)]],
    key: [''],
    dataType: ['TEXT' as DataType, [Validators.required]],
    unit: [''],
    options: [''],
    required: [false],
    appliesTo: ['BOTH' as AppliesTo, [Validators.required]],
  });

  // ── Vocabulários pt-BR (DD-09: glossário vivo) ─────────────
  readonly VERTICALS: { value: Vertical; label: string }[] = [
    { value: 'GENERIC', label: 'Geral' },
    { value: 'SERVICE', label: 'Serviços' },
    { value: 'SANITARY', label: 'Sanitário (ANVISA etc.)' },
    { value: 'HAZARDOUS', label: 'Perigosos (químicos)' },
    { value: 'APPAREL', label: 'Vestuário (grades)' },
    { value: 'CONSTRUCTION', label: 'Construção' },
  ];

  readonly DATA_TYPES: { value: DataType; label: string }[] = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'NUMBER', label: 'Número' },
    { value: 'DATE', label: 'Data' },
    { value: 'BOOLEAN', label: 'Sim / Não' },
    { value: 'ENUM', label: 'Lista de opções' },
  ];

  readonly APPLIES_TO: { value: AppliesTo; label: string }[] = [
    { value: 'BOTH', label: 'Produtos e Serviços' },
    { value: 'PRODUCT', label: 'Somente Produtos' },
    { value: 'SERVICE', label: 'Somente Serviços' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.categoryService.tree(false).subscribe({
      next: (list) => {
        this.categories = list;
        this.rebuildRows();
      },
      error: () =>
        this.snack.open('Erro ao carregar categorias.', 'Fechar', { duration: 3000 }),
    });
  }

  /** Resumo p/ cabeçalho. */
  get stats(): { total: number; inactive: number; items: number } {
    return {
      total: this.categories.length,
      inactive: this.categories.filter((c) => !c.active).length,
      items: this.categories.reduce((acc, c) => acc + (c.itemCount || 0), 0),
    };
  }

  // ═══ Árvore com poda (filters não trocam o layout nunca) ═══
  rebuildRows(): void {
    const term = this.filter.trim().toLowerCase();

    /** O nó atende aos filtros atuais? */
    const matches = (c: CategoryResponse): boolean =>
      (this.statusFilter === '' ||
        (this.statusFilter === 'active' ? c.active : !c.active)) &&
      (!this.verticalFilter || c.vertical === this.verticalFilter) &&
      (!term || c.name.toLowerCase().includes(term));

    const byId = new Map(this.categories.map((c) => [c.id, c]));
    const byParent = new Map<string | null, CategoryResponse[]>();
    for (const c of this.categories) {
      const key = c.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }

    const cmp = (a: CategoryResponse, b: CategoryResponse) =>
      this.sortBy === 'items'
        ? (b.itemCount || 0) - (a.itemCount || 0)
        : a.name.localeCompare(b.name);
    byParent.forEach((list) => list.sort(cmp));

    // Nós visíveis = os que batem + ancestrais (contexto) + descendentes (subárvore)
    const kept = new Set<string>();
    const markAncestors = (c: CategoryResponse) => {
      let p = c.parentId ? byId.get(c.parentId) : undefined;
      while (p) {
        kept.add(p.id);
        p = p.parentId ? byId.get(p.parentId) : undefined;
      }
    };
    const markDescendants = (c: CategoryResponse) => {
      for (const child of byParent.get(c.id) ?? []) {
        kept.add(child.id);
        markDescendants(child);
      }
    };
    for (const c of this.categories) {
      if (matches(c)) {
        kept.add(c.id);
        markAncestors(c);
        markDescendants(c);
      }
    }

    const rows: CategoryRow[] = [];
    const walk = (parentId: string | null, level: number) => {
      for (const c of byParent.get(parentId) ?? []) {
        if (!kept.has(c.id)) continue;   // podado pelo filtro
        rows.push({ cat: c, level });
        walk(c.id, level + 1);
      }
    };
    walk(null, 0);
    this.rows = rows;
  }

  // ── Handlers da toolbar / busca ────────────────────────────
  onFilterChange(value: string): void {
    this.filter = value;
    this.rebuildRows();
  }

  onStatusChange(value: string): void {
    this.statusFilter = value as '' | 'active' | 'inactive';
    this.rebuildRows();
  }

  onVerticalChange(value: string): void {
    this.verticalFilter = value;
    this.rebuildRows();
  }

  onSortChange(value: string): void {
    this.sortBy = value as 'name' | 'items';
    this.rebuildRows();
  }

  // ═══ Seleção / criação ════════════════════════════════════
  select(cat: CategoryResponse): void {
    this.selected = cat;
    this.mode = 'edit';
    this.showDefEditor = false;
    this.form.patchValue({
      name: cat.name,
      parentId: cat.parentId ?? '',
      vertical: cat.vertical,
      active: cat.active,
    });
    this.loadDefs(cat.id);
  }

  newCategory(): void {
    this.selected = null;
    this.mode = 'create';
    this.showDefEditor = false;
    this.defs = [];
    this.form.reset({ name: '', parentId: '', vertical: 'GENERIC', active: true });
  }

  cancel(): void {
    this.mode = null;
    this.selected = null;
    this.defs = [];
    this.showDefEditor = false;
  }

  /** Opções de "seção pai": exclui a si mesma e descendentes (evita ciclo). */
  get parentOptions(): CategoryResponse[] {
    if (!this.selected) return this.categories;
    const blocked = new Set<string>([this.selected.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of this.categories) {
        if (c.parentId && blocked.has(c.parentId) && !blocked.has(c.id)) {
          blocked.add(c.id);
          changed = true;
        }
      }
    }
    return this.categories.filter((c) => !blocked.has(c.id));
  }

  // ═══ Save / delete categoria ══════════════════════════════
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const req: CategoryRequest = {
      name: v.name.trim(),
      parentId: v.parentId || null,
      vertical: v.vertical,
      active: !!v.active,
    };

    this.saving = true;
    const req$ =
      this.mode === 'create'
        ? this.categoryService.create(req)
        : this.categoryService.update(this.selected!.id, req);

    req$.subscribe({
      next: (saved) => {
        this.snack.open(
          this.mode === 'create' ? 'Categoria criada!' : 'Categoria atualizada!',
          'OK',
          { duration: 2500 },
        );
        this.saving = false;
        this.load();
        this.selected = saved;
        this.mode = 'edit';
      },
      error: (err) => {
        this.saving = false;
        this.snack.open(err?.error?.message ?? 'Erro ao salvar.', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  remove(cat: CategoryResponse): void {
    const msg = `Excluir a seção "${cat.name}"? Se ela tiver itens ativos ou subseções, o sistema bloqueará a exclusão.`;
    if (!confirm(msg)) return;

    this.categoryService.remove(cat.id).subscribe({
      next: () => {
        this.snack.open('Categoria excluída.', 'OK', { duration: 2500 });
        if (this.selected?.id === cat.id) this.cancel();
        this.load();
      },
      error: (err) =>
        this.snack.open(err?.error?.message ?? 'Erro ao excluir.', 'Fechar', {
          duration: 4000,
        }),
    });
  }

  // ═══ Campos extras (defs) ═════════════════════════════════
  loadDefs(categoryId: string): void {
    this.categoryService.listDefs(categoryId).subscribe({
      next: (d) => (this.defs = d),
      error: () => (this.defs = []),
    });
  }

  toggleDefEditor(): void {
    this.showDefEditor = !this.showDefEditor;
    if (this.showDefEditor) {
      this.defForm.reset({
        label: '',
        key: '',
        dataType: 'TEXT',
        unit: '',
        options: '',
        required: false,
        appliesTo: 'BOTH',
      });
    }
  }

  saveDef(): void {
    if (!this.selected) return;
    if (this.defForm.invalid) {
      this.defForm.markAllAsTouched();
      return;
    }
    const v = this.defForm.getRawValue();
    const options =
      v.dataType === 'ENUM'
        ? String(v.options || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : null;

    const req: AttributeDefRequest = {
      label: v.label.trim(),
      key: (v.key || '').trim() || this.slugify(v.label),
      dataType: v.dataType,
      unit: v.unit || null,
      options,
      required: !!v.required,
      appliesTo: v.appliesTo,
      sortOrder: this.defs.length + 1,
    };

    this.categoryService.saveDef(this.selected.id, req).subscribe({
      next: () => {
        this.snack.open('Campo extra adicionado à seção!', 'OK', { duration: 2500 });
        this.showDefEditor = false;
        this.loadDefs(this.selected!.id);
      },
      error: (err) =>
        this.snack.open(err?.error?.message ?? 'Erro ao adicionar campo.', 'Fechar', {
          duration: 4000,
        }),
    });
  }

  deleteDef(def: AttributeDefResponse): void {
    const msg = `Remover o campo "${def.label}" da seção? Itens já cadastrados mantêm o valor gravado, mas o campo some do formulário.`;
    if (!confirm(msg)) return;

    this.categoryService.deleteDef(def.id).subscribe({
      next: () => {
        this.snack.open('Campo removido.', 'OK', { duration: 2500 });
        this.loadDefs(this.selected!.id);
      },
      error: (err) =>
        this.snack.open(err?.error?.message ?? 'Erro ao remover.', 'Fechar', {
          duration: 4000,
        }),
    });
  }

  // ═══ Helpers ══════════════════════════════════════════════
  private slugify(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  verticalLabel(v: Vertical): string {
    return this.VERTICALS.find((x) => x.value === v)?.label ?? v;
  }

  dataTypeLabel(t: DataType): string {
    return this.DATA_TYPES.find((x) => x.value === t)?.label ?? t;
  }

  appliesToLabel(a: AppliesTo): string {
    return this.APPLIES_TO.find((x) => x.value === a)?.label ?? a;
  }
}