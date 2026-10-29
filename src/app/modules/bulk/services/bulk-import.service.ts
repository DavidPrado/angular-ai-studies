import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../assets/environments/environment';
import { RowErrorDetail } from '../models/bulk-job.model';
import {
  BulkJob,
  CreateImportJobPayload,
  CreateImportJobResponse,
} from '../models/bulk-job.model';

@Injectable({ providedIn: 'root' })
export class BulkImportService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.api.baseUrl}/${environment.api.version}/bulk`;

  createImpotJob(
    entity: string,
    payload: CreateImportJobPayload,
  ): Observable<CreateImportJobResponse> {
    return this.http.post<CreateImportJobResponse>(
      `${this.baseUrl}/${entity}/import`,
      payload,
      { withCredentials: true },
    );
  }

  listUserJobs(): Observable<BulkJob[]> {
    return this.http.get<BulkJob[]>(`${this.baseUrl}/jobs`, {
      withCredentials: true,
    });
  }

  getJobDetail(jobId: String): Observable<BulkJob> {
    return this.http.get<BulkJob>(`${this.baseUrl}/jobs/${jobId}`, {
      withCredentials: true,
    });
  }

  cancelJob(jobId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/jobs/${jobId}/cancel`,
      {}, // Body vazio (ação é identificada pelo jobId na URL)
      { withCredentials: true },
    );
  }

  getJobErrorDetails(jobId: string): Observable<RowErrorDetail[]> {
    return this.http.get<RowErrorDetail[]>(
      `${this.baseUrl}/jobs/${jobId}/errors/detail`,
      {
        withCredentials: true,
      },
    );
  }
}
