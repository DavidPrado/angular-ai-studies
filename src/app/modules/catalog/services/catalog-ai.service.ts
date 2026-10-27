import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../assets/environments/environment';

export interface AiEnrichmentResponse {
  category: string;
  tags: string[];
  enhancedDescription: string;
}

export interface EnrichmentRequest {
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogAiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.baseUrl}/${environment.api.version}/catalog/items/ai`;

  enrichProduct(request: EnrichmentRequest): Observable<AiEnrichmentResponse> {
    return this.http.post<AiEnrichmentResponse>(
      `${this.baseUrl}/enrich`,
      request,
      { withCredentials: true },
    );
  }

  classifyProduct(name: string): Observable<{ type: string }> {
    return this.http.post<{ type: string }>(
      `${this.baseUrl}/classify`,
      { name },
      { withCredentials: true },
    );
  }

  extractSku(text: string): Observable<{ sku: string }> {
    return this.http.post<{ sku: string }>(
      `${this.baseUrl}/extract-sku`,
      { text },
      { withCredentials: true },
    );
  }

  suggestSku(name: string): Observable<{ sku: string }> {
    return this.http.post<{ sku: string }>(
      `${this.baseUrl}/suggest-sku`,
      { name },
      { withCredentials: true },
    );
  }
}
