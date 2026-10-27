import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserResponse, PageResponse } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/http/api.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);
  private readonly httpClient = inject(HttpClient);
  private readonly path = 'users';

  list(params: Record<string, any>): Observable<PageResponse<UserResponse>> {
    const sanitizedParams: Record<string, string> = {};
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ''
      ) {
        sanitizedParams[key] = params[key].toString();
      }
    });
    return this.api.get<PageResponse<UserResponse>>(this.path, sanitizedParams);
  }

  listRoles(params: Record<string, string> = {}): Observable<any> {
    return this.api.get<any>('roles', params);
  }

  getById(userId: string): Observable<UserResponse> {
    return this.api.get<UserResponse>(`${this.path}/${userId}`);
  }

  create(userData: any): Observable<UserResponse> {
    return this.api.post<UserResponse>(this.path, userData);
  }

  delete(userId: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${userId}`);
  }

  deleteBatch(ids: string[]): Observable<void> {
    return this.api.deleteWithBody<void>(`${this.path}/batch`, ids);
  }

  update(userId: string, data: any): Observable<void> {
    return this.api.put<void>(`${this.path}/${userId}`, data);
  }

  toggleStatus(userId: string, active: boolean): Observable<void> {
    return this.api.patch<void>(
      `${this.path}/${userId}/status`,
      {},
      {
        active: active.toString(),
      },
    );
  }

  uploadProfilePicture(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = this.api.buildUrl(`${this.path}/${userId}/profile-picture`);
    return this.httpClient.post(url, formData, { withCredentials: true });
  }

  getThumbnailUrl(userId: string): string {
    return this.api.buildUrl(
      `${this.path}/${userId}/profile-picture/thumbnail`,
    );
  }

  getMyThumbnailUrl(): string {
    return this.api.buildUrl(`${this.path}/me/profile-picture/thumbnail`);
  }
}
