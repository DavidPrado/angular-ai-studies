import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PageResponse } from '../../../shared/models/page.model';
import { RoleRequest, RoleResponse, RoleUpdateRequest, RoleSummary } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly api = inject(ApiService);
  private readonly path = 'roles';

  list(params: Record<string, string> = {}): Observable<PageResponse<RoleSummary>> {
    return this.api.get<PageResponse<RoleSummary>>(this.path, params);
  }

  getById(id: string): Observable<RoleResponse> {
    return this.api.get<RoleResponse>(`${this.path}/${id}`);
  }

  create(req: RoleRequest): Observable<void> {
    return this.api.post<void>(this.path, req);
  }

  update(id: string, req: RoleUpdateRequest): Observable<void> {
    return this.api.put<void>(`${this.path}/${id}`, req);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${id}`);
  }
}