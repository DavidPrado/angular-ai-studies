import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PageResponse } from '../../../shared/models/page.model';
import {
  CatalogItemRequest,
  CatalogItemResponse,
  CatalogItemSummary,
  ItemStatus,
} from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);
  private readonly path = 'catalog/items';

  list(
    params: Record<string, string> = {},
  ): Observable<PageResponse<CatalogItemSummary>> {
    return this.api.get<PageResponse<CatalogItemSummary>>(this.path, params);
  }

  getById(id: string): Observable<CatalogItemResponse> {
    return this.api.get<CatalogItemResponse>(`${this.path}/${id}`);
  }

  create(req: CatalogItemRequest): Observable<CatalogItemResponse> {
    return this.api.post<CatalogItemResponse>(this.path, req);
  }

  update(id: string, req: CatalogItemRequest): Observable<CatalogItemResponse> {
    return this.api.patch<CatalogItemResponse>(`${this.path}/${id}`, req);
  }

  changeStatus(
    id: string,
    status: ItemStatus,
  ): Observable<CatalogItemResponse> {
    return this.api.put<CatalogItemResponse>(`${this.path}/${id}/status`, {
      status,
    });
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${id}`);
  }
}
