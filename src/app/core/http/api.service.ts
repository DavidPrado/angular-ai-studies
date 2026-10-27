import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../assets/environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = environment.api;

  private readonly defaultOptions = {
    withCredentials: true,
  };

  public buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl}/${this.config.version}${cleanPath}`;
  }

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http
      .get<T>(this.buildUrl(path), {
        ...this.defaultOptions,
        params: new HttpParams({ fromObject: params || {} }),
      })
      .pipe(timeout(this.config.timeout * 1000));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http
      .post<T>(this.buildUrl(path), body, this.defaultOptions)
      .pipe(timeout(this.config.timeout * 1000));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http
      .put<T>(this.buildUrl(path), body, this.defaultOptions)
      .pipe(timeout(this.config.timeout * 1000));
  }

  patch<T>(
    path: string,
    body: any = {},
    params?: Record<string, string>,
  ): Observable<T> {
    return this.http
      .patch<T>(this.buildUrl(path), body, {
        ...this.defaultOptions,
        params: new HttpParams({ fromObject: params || {} }),
      })
      .pipe(timeout(this.config.timeout * 1000));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(path), this.defaultOptions)
      .pipe(timeout(this.config.timeout * 1000));
  }

  deleteWithBody<T>(path: string, body: any): Observable<T> {
    return this.http
      .request<T>('delete', this.buildUrl(path), {
        ...this.defaultOptions,
        body: body,
      })
      .pipe(timeout(this.config.timeout * 1000));
  }

  download(
    path: string,
    params?: Record<string, string>,
    timeoutSeconds?: number,
  ): Observable<HttpResponse<Blob>> {
    const options = {
      ...this.defaultOptions,
      params: new HttpParams({ fromObject: params || {} }),
      responseType: 'blob' as const,     
      observe: 'response' as const,    
    };

    return this.http
      .get(this.buildUrl(path), options)
      .pipe(timeout((timeoutSeconds ?? this.config.timeout * 4) * 1000));
  }
}
