export type ItemType = 'PRODUCT' | 'SERVICE';
export type ItemStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type Vertical = | 'GENERIC' | 'SERVICE' | 'SANITARY' | 'HAZARDOUS' | 'APPAREL' | 'CONSTRUCTION';
export type DataType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ENUM';
export type AppliesTo = 'PRODUCT' | 'SERVICE' | 'BOTH';
export type UnitOfMeasure =  | 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'M2' | 'M3' | 'HR' | 'CX' | 'PC';

export interface CatalogItemSummary {
  id: string;
  sku: string;
  ean: string | null;
  name: string;
  itemType: ItemType;
  status: ItemStatus;
  categoryId: string;
  categoryName: string | null;
  vertical: Vertical;
  unitOfMeasure: UnitOfMeasure;
  salePrice: number;
  costPrice: number;
  marginPercent: number;
  tracksBatch: boolean;
  tracksExpiry: boolean;
  isHazardous: boolean;
  updatedAt: string;
}

export interface VariantResponse {
  id: string;
  sku: string;
  ean: string | null;
  extraData: Record<string, any>;
  priceAdjustment: number;
  active: boolean;
}

export interface CatalogItemResponse {
  id: string;
  sku: string;
  ean: string | null;
  name: string;
  description: string | null;
  itemType: ItemType;
  status: ItemStatus;
  categoryId: string;
  categoryName: string | null;
  vertical: Vertical;
  unitOfMeasure: UnitOfMeasure;
  salePrice: number;
  costPrice: number;
  marginPercent: number;
  ncm: string | null;
  cest: string | null;
  taxOrigin: string | null;
  cstIcms: string | null;
  csosn: string | null;
  serviceCode: string | null;
  issRate: number | null;
  tracksBatch: boolean;
  tracksExpiry: boolean;
  isHazardous: boolean;
  extraData: Record<string, any>;
  minStock: number | null;
  maxStock: number | null;
  reorderStock: number | null;
  variants: VariantResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface VariantRequest {
  sku: string;
  ean?: string;
  extraData?: Record<string, any>;
  priceAdjustment?: number;
  active?: boolean;
}

export interface CatalogItemRequest {
  categoryId: string;
  itemType: ItemType;
  sku?: string;
  ean?: string;
  name: string;
  description?: string;
  unitOfMeasure: UnitOfMeasure;
  salePrice: number;
  costPrice: number;
  ncm?: string;
  cest?: string;
  taxOrigin?: string;
  cstIcms?: string;
  csosn?: string;
  serviceCode?: string;
  issRate?: number;
  tracksBatch: boolean;
  tracksExpiry: boolean;
  isHazardous: boolean;
  extraData?: Record<string, any>;
  minStock?: number | null;
  maxStock?: number | null;
  reorderStock?: number | null;
  variants?: VariantRequest[];
}

export interface CategoryResponse {
  id: string;
  parentId: string | null;
  name: string;
  vertical: Vertical;
  active: boolean;
  itemCount: number;
}

export interface AttributeDefResponse {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  dataType: DataType;
  unit: string | null;
  options: string[] | null;
  required: boolean;
  appliesTo: AppliesTo;
  sortOrder: number;
}

export interface CategoryRequest {
  name: string;
  parentId: string | null;
  vertical: Vertical;
  active: boolean;
}

export interface AttributeDefRequest {
  key: string;
  label: string;
  dataType: DataType;
  unit: string | null;
  options: string[] | null;
  required: boolean;
  appliesTo: AppliesTo;
  sortOrder: number;
}