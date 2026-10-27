import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import {
  AttributeDefRequest,
  AttributeDefResponse,
  CategoryRequest,
  CategoryResponse,
} from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogCategoryService {
  private readonly api = inject(ApiService);
  private readonly path = 'catalog/categories';

  /** Árvore flat (com parentId p/ montar níveis no front). */
  tree(activeOnly = false): Observable<CategoryResponse[]> {
    return this.api.get<CategoryResponse[]>(`${this.path}/tree`, {
      activeOnly: String(activeOnly),
    });
  }

  create(req: CategoryRequest): Observable<CategoryResponse> {
    return this.api.post<CategoryResponse>(this.path, req);
  }

  update(id: string, req: CategoryRequest): Observable<CategoryResponse> {
    return this.api.put<CategoryResponse>(`${this.path}/${id}`, req);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${id}`);
  }

  /** Campos extras ("perguntas") da categoria. */
  listDefs(categoryId: string): Observable<AttributeDefResponse[]> {
    return this.api.get<AttributeDefResponse[]>(`${this.path}/${categoryId}/attributes`);
  }

  saveDef(categoryId: string, req: AttributeDefRequest): Observable<AttributeDefResponse> {
    return this.api.post<AttributeDefResponse>(`${this.path}/${categoryId}/attributes`, req);
  }

  deleteDef(defId: string): Observable<void>
  {
    return this.api.delete<void>(`${this.path}/attributes/${defId}`);
  }
}