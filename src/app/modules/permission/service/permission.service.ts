import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PermissionDetailResponse } from '../model/permission.model';


@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly api = inject(ApiService);

  list(): Observable<PermissionDetailResponse[]> {
    return this.api.get<PermissionDetailResponse[]>('permissions');
  }

  listCategories(): Observable<string[]> {
    return this.api.get<string[]>('permissions/categories');
  }
}