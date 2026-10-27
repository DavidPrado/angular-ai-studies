import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../../assets/environments/environment';


@Injectable({ providedIn: 'root' })
export class BulkService {
  private readonly http = inject(HttpClient);
  private readonly config = environment.api;

  private readonly defaultOptions = {
    withCredentials: true, 
  };


  private readonly basePath = '/bulk';

  exportCsv(
    entity: string,
    params: Record<string, string> = {},
  ): Observable<HttpResponse<Blob>> {
    return this.download(`${this.basePath}/${entity}/export`, {
      format: 'csv', // ← CRÍTICO: especifica formato CSV
      ...params,
    });
  }


  exportXlsx(
    entity: string,
    params: Record<string, string> = {},
  ): Observable<HttpResponse<Blob>> {
    return this.download(`${this.basePath}/${entity}/export`, {
      format: 'xlsx', // ← CRÍTICO: especifica formato Excel
      ...params,
    });
  }

  private download(
    path: string,
    params: Record<string, string> = {},
    timeoutSeconds?: number,
  ): Observable<HttpResponse<Blob>> {
    const options = {
      ...this.defaultOptions,
      params: new HttpParams({ fromObject: params }),
      responseType: 'blob' as const, 
      observe: 'response' as const,
    };

    return this.http
      .get(this.buildUrl(path), options)
      .pipe(timeout((timeoutSeconds ?? this.config.timeout * 4) * 1000));
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl}/${this.config.version}${cleanPath}`;
  }

  saveBlob(response: HttpResponse<Blob>): string {

    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    const filename = filenameMatch ? filenameMatch[1] : 'export.xlsx';

    const blob = response.body!;
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();


    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return filename;
  }
}