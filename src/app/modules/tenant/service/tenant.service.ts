import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { TenantRequest, TenantResponse } from '../../tenant/models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private api = inject(ApiService);
  private readonly PATH = '/system/tenants';

  findAll(params?: any): Observable<any> {
    return this.api.get<any>(this.PATH, params);
  }

  findById(id: string): Observable<TenantRequest> {
    return this.api.get<TenantResponse>(`${this.PATH}/${id}`);
  }

  create(request: TenantRequest): Observable<TenantResponse> {
    return this.api.post<TenantResponse>(this.PATH, request);
  }

  update(id: string, request: TenantRequest): Observable<void> {
    return this.api.put<void>(`${this.PATH}/${id}`, request);
  }

  updateStatus(id: string, active: boolean, inactivationReason?: string): Observable<void> {
    return this.api.patch<void>(`${this.PATH}/${id}/status`, {
      active,
      inactivationReason,
    });
  }
}
