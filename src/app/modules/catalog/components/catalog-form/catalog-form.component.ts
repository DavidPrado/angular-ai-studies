import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogService } from '../../services/catalog.service';
import { CatalogCategoryService } from '../../services/catalog-category.service';
import {
  AttributeDefResponse,
  CatalogItemRequest,
  CategoryResponse,
  ItemType,
  UnitOfMeasure,
} from '../../models/catalog.model';
import {
  CatalogAiService,
  AiEnrichmentResponse,
} from '../../services/catalog-ai.service';
import { AiEnrichmentButtonComponent } from '../ai-enrichment-button/ai-enrichment-button.component';

@Component({
  selector: 'app-catalog-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
    AiEnrichmentButtonComponent,
  ],
  templateUrl: './catalog-form.component.html',
  styleUrl: './catalog-form.component.scss',
})
export class CatalogFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly categoryService = inject(CatalogCategoryService);
  private readonly aiService = inject(CatalogAiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  isEditMode = false;
  itemId: string | null = null;

  categories: CategoryResponse[] = [];
  defs: AttributeDefResponse[] = [];

  private savedExtra: Record<string, any> = {};
  private readonly basePath = '/v1/catalogo';

  extraForm: FormGroup = this.fb.group({});

  itemForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    categoryId: ['', [Validators.required]],
    itemType: ['PRODUCT' as ItemType, [Validators.required]],
    sku: [''],
    ean: [''],
    unitOfMeasure: ['UN' as UnitOfMeasure, [Validators.required]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    // Fiscal mercadoria
    ncm: [''],
    cest: [''],
    taxOrigin: [''],
    cstIcms: [''],
    csosn: [''],
    // Fiscal serviço
    serviceCode: [''],
    issRate: [null as number | null],
    // Controles
    tracksBatch: [false],
    tracksExpiry: [false],
    isHazardous: [false],
    // Reposição
    minStock: [null as number | null],
    maxStock: [null as number | null],
    reorderStock: [null as number | null],
    variants: this.fb.array([]),
  });

  /** Unidades com rótulo em português (espelho do enum backend). */
  readonly UNITS: { value: UnitOfMeasure; label: string }[] = [
    { value: 'UN', label: 'Unidade' },
    { value: 'KG', label: 'Quilograma' },
    { value: 'G', label: 'Grama' },
    { value: 'L', label: 'Litro' },
    { value: 'ML', label: 'Mililitro' },
    { value: 'M', label: 'Metro' },
    { value: 'M2', label: 'Metro quadrado' },
    { value: 'M3', label: 'Metro cúbico' },
    { value: 'HR', label: 'Hora' },
    { value: 'CX', label: 'Caixa' },
    { value: 'PC', label: 'Pacote' },
  ];

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.itemId;

    this.categoryService.tree(true).subscribe({
      next: (list) => {
        this.categories = list;
        if (this.isEditMode) this.loadItem(this.itemId!);
      },
      error: () =>
        this.snack.open('Erro ao carregar categorias.', 'Fechar', {
          duration: 3000,
        }),
    });
  }

  // ── Getters de conveniência ──────────────────────────────────
  get isService(): boolean {
    return this.itemForm.get('itemType')?.value === 'SERVICE';
  }

  get currentType(): ItemType {
    return (this.itemForm.get('itemType')?.value as ItemType) ?? 'PRODUCT';
  }

  /** Defs visíveis p/ o tipo atual (PRODUCT/SERVICE/BOTH). */
  get visibleDefs(): AttributeDefResponse[] {
    return this.defs.filter(
      (d) => d.appliesTo === 'BOTH' || d.appliesTo === this.currentType,
    );
  }

  get marginPercent(): number {
    const sale = Number(this.itemForm.get('salePrice')?.value ?? 0);
    const cost = Number(this.itemForm.get('costPrice')?.value ?? 0);
    if (sale <= 0) return 0;
    return Math.round(((sale - cost) / sale) * 10000) / 100;
  }

  get canSave(): boolean {
    return (
      this.itemForm.valid &&
      this.extraForm.valid &&
      this.variantsArray.controls.every((v) => v.valid)
    );
  }

  get nameValue(): string {
    return this.itemForm.get('name')?.value || '';
  }

  get descriptionValue(): string {
    return this.itemForm.get('description')?.value || '';
  }

  get canUseAiEnrichment(): boolean {
    const name = this.itemForm.get('name')?.value;
    return typeof name === 'string' && name.length >= 3;
  }

  // ── Carga p/ edição ──────────────────────────────────────────
  private loadItem(id: string): void {
    this.catalogService.getById(id).subscribe({
      next: (item) => {
        this.itemForm.patchValue({
          name: item.name,
          description: item.description ?? '',
          categoryId: item.categoryId,
          itemType: item.itemType,
          sku: item.sku,
          ean: item.ean ?? '',
          unitOfMeasure: item.unitOfMeasure,
          salePrice: item.salePrice,
          costPrice: item.costPrice,
          ncm: item.ncm ?? '',
          cest: item.cest ?? '',
          taxOrigin: item.taxOrigin ?? '',
          cstIcms: item.cstIcms ?? '',
          csosn: item.csosn ?? '',
          serviceCode: item.serviceCode ?? '',
          issRate: item.issRate,
          tracksBatch: item.tracksBatch,
          tracksExpiry: item.tracksExpiry,
          isHazardous: item.isHazardous,
          minStock: item.minStock,
          maxStock: item.maxStock,
          reorderStock: item.reorderStock,
        });
        this.savedExtra = { ...(item.extraData ?? {}) };
        this.loadDefs();

        const variants = item.variants ?? [];

        variants.forEach((v) =>
          this.addVariant({
            sku: v.sku,
            ean: v.ean ?? '',
            grade: v.extraData?.['grade'] ?? '',
            priceAdjustment: Number(
              v.priceAdjustment ?? (v as any).priceAdjustment ?? 0,
            ),
            active: v.active,
          }),
        );
      },
      error: () =>
        this.snack.open('Erro ao carregar o item.', 'Fechar', {
          duration: 3000,
        }),
    });
  }

  onCategoryChange(): void {
    this.loadDefs();
  }

  onTypeChange(): void {
    this.loadDefs(); // re-filtra appliesTo preservando valores
  }

  private loadDefs(): void {
    const categoryId = this.itemForm.get('categoryId')?.value as string;
    if (!categoryId) {
      this.defs = [];
      this.rebuildExtraForm();
      return;
    }
    this.categoryService.listDefs(categoryId).subscribe({
      next: (defs) => {
        this.defs = defs;
        this.rebuildExtraForm();
      },
      error: () => {
        this.defs = [];
        this.rebuildExtraForm();
      },
    });
  }

  /** Reconstrói o FormGroup dinâmico preservando valores já informados. */
  private rebuildExtraForm(): void {
    const current = { ...this.savedExtra, ...this.extraForm.getRawValue() };
    const group: Record<string, any> = {};

    for (const def of this.visibleDefs) {
      const value =
        current[def.key] ?? (def.dataType === 'BOOLEAN' ? false : '');
      group[def.key] = [value, def.required ? [Validators.required] : []];
    }
    this.extraForm = this.fb.group(group);
  }

  // ── Variantes (grade) ────────────────────────────────────────
  addVariant(
    prefill?: Partial<{
      sku: string;
      ean: string;
      grade: string;
      priceAdjustment: number;
      active: boolean;
    }>,
  ): void {
    this.variantsArray.push(
      this.fb.group({
        sku: [prefill?.sku ?? '', [Validators.required]],
        ean: [prefill?.ean ?? ''],
        grade: [prefill?.grade ?? ''],
        priceAdjustment: [prefill?.priceAdjustment ?? 0],
        active: [prefill?.active ?? true],
      }),
    );
  }

  removeVariant(index: number): void {
    this.variantsArray.removeAt(index);
  }

  cancel(): void {
    this.router.navigate([this.basePath]);
  }

  onSubmit(): void {
    if (!this.canSave) {
      this.itemForm.markAllAsTouched();
      this.extraForm.markAllAsTouched();
      this.variantsArray.controls.forEach((v) => v.markAllAsTouched());
      this.snack.open('Revise os campos obrigatórios destacados.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    const v = this.itemForm.getRawValue();

    const request: CatalogItemRequest = {
      categoryId: v.categoryId!, // ✅ obrigatório → garantido pelo canSave
      itemType: v.itemType!, // ✅ obrigatório
      sku: v.sku || undefined,
      ean: v.ean || undefined,
      name: v.name!.trim(), // ✅ obrigatório (min 3)
      description: v.description || undefined,
      unitOfMeasure: v.unitOfMeasure!, // ✅ obrigatório
      salePrice: Number(v.salePrice),
      costPrice: Number(v.costPrice),
      ncm: v.ncm || undefined,
      cest: v.cest || undefined,
      taxOrigin: v.taxOrigin || undefined,
      cstIcms: v.cstIcms || undefined,
      csosn: v.csosn || undefined,
      serviceCode: v.serviceCode || undefined,
      issRate: v.issRate != null ? Number(v.issRate) : undefined,
      tracksBatch: !!v.tracksBatch,
      tracksExpiry: !!v.tracksExpiry,
      isHazardous: !!v.isHazardous,
      extraData: this.extraForm.getRawValue(),
      minStock: v.minStock,
      maxStock: v.maxStock,
      reorderStock: v.reorderStock,
      variants: this.variantsArray.controls.map((c) => {
        const row = c.getRawValue();
        return {
          sku: row.sku!.trim(), // ✅ variante: SKU é required no grupo
          ean: row.ean || undefined,
          extraData: row.grade ? { grade: row.grade } : {},
          priceAdjustment: Number(row.priceAdjustment ?? 0),
          active: !!row.active,
        };
      }),
    };

    const request$ = this.isEditMode
      ? this.catalogService.update(this.itemId!, request)
      : this.catalogService.create(request);

    request$.subscribe({
      next: (saved) => {
        this.snack.open(
          this.isEditMode
            ? 'Item atualizado com sucesso!'
            : `Item criado como rascunho (${saved.sku}). Ative-o quando estiver pronto.`,
          'OK',
          { duration: 3500 },
        );
        this.router.navigate([this.basePath]);
      },
      error: (err) =>
        this.snack.open(
          err?.error?.message ?? 'Erro ao salvar o item.',
          'Fechar',
          {
            duration: 4500,
          },
        ),
    });
  }

  get variantsArray(): FormArray {
    return this.itemForm.get('variants') as FormArray;
  }

  onAiEnriched(response: AiEnrichmentResponse): void {
    this.itemForm.patchValue({
      description: response.enhancedDescription,
    });

    const matchedCategory = this.categories.find(
      (cat) => cat.name.toLowerCase() === response.category.toLowerCase(),
    );

    if (matchedCategory) {
      this.itemForm.patchValue({
        categoryId: matchedCategory.id,
      });
      this.onCategoryChange();
    } else {
      this.snack.open(
        `Categoria "${response.category}" sugerida não encontrada. Selecione manualmente.`,
        'OK',
        { duration: 5000 },
      );
    }

    this.snack.open('✨ Campos preenchidos automaticamente pela IA!', 'OK', {
      duration: 3000,
      panelClass: 'snack-success',
    });
  }
}
