import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../assets/environments/environment';
import { RowErrorDetail } from '../../models/bulk-job.model';

export interface JobErrorsDialogData {
  jobId: string;
}

@Component({
  selector: 'app-job-errors-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './job-errors-drawer.component.html',
  styleUrl: './job-errors-drawer.component.scss',
})
export class JobErrorsDrawerComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<JobErrorsDrawerComponent>);
  private data = inject<JobErrorsDialogData>(MAT_DIALOG_DATA);

  isLoading = true;
  errors: RowErrorDetail[] = [];
  selectedError: RowErrorDetail | null = null;
  jobId = this.data.jobId;

  displayedColumns = ['line', 'keyField', 'errors', 'actions'];

  private readonly baseUrl = `${environment.api.baseUrl}/${environment.api.version}/bulk`;

  constructor() {
    this.loadErrors();
  }

  loadErrors() {
    console.log(' [MODAL] Carregando erros para jobId:', this.jobId);

    this.http
      .get<RowErrorDetail[]>(
        `${this.baseUrl}/jobs/${this.jobId}/errors/detail`,
        {
          withCredentials: true,
        },
      )
      .subscribe({
        next: (data) => {
          console.log(' [MODAL] Erros carregados:', data.length);
          this.errors = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('🔴 [MODAL] Erro ao carregar:', err);
          this.snackBar.open('Erro ao carregar detalhes dos erros', 'Fechar', {
            duration: 3000,
          });
          this.isLoading = false;
        },
      });
  }

  close() {
    this.dialogRef.close();
  }

  selectError(error: RowErrorDetail) {
    this.selectedError = error;
  }

  backToList() {
    this.selectedError = null;
  }

  extractKeyField(errorOrRowData: any): string {
    if (
      errorOrRowData &&
      errorOrRowData.rowData &&
      typeof errorOrRowData.rowData === 'object'
    ) {
      const rowData = errorOrRowData.rowData;
      return rowData['sku'] || rowData['ean'] || rowData['name'] || 'N/A';
    }

    if (typeof errorOrRowData === 'object' && errorOrRowData !== null) {
      return (
        errorOrRowData['sku'] ||
        errorOrRowData['ean'] ||
        errorOrRowData['name'] ||
        'N/A'
      );
    }

    if (typeof errorOrRowData === 'string') {
      const skuMatch = errorOrRowData.match(/sku=([^,}]+)/);
      if (skuMatch && skuMatch[1].trim()) {
        return skuMatch[1].trim();
      }

      const nameMatch = errorOrRowData.match(/name=([^,}]+)/);
      if (nameMatch && nameMatch[1].trim()) {
        const name = nameMatch[1].trim();
        return name.length > 30 ? name.substring(0, 30) + '...' : name;
      }
    }

    return 'N/A';
  }

  copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.snackBar.open('Copiado para a área de transferência!', 'Fechar', {
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error('Erro ao copiar:', err);
        this.snackBar.open('Erro ao copiar', 'Fechar', { duration: 2000 });
      });
  }

  // ✅ IMPLEMENTAÇÃO REAL DO DOWNLOAD
  // ✅ MÉTODO SIMPLIFICADO: Gera CSV no frontend sem precisar de API
  downloadCsv() {
    console.log('🔵 [MODAL] Gerando CSV no frontend...');

    if (this.errors.length === 0) {
      this.snackBar.open('Não há erros para exportar', 'Fechar', {
        duration: 2000,
      });
      return;
    }

    try {
      // 1. Monta o cabeçalho do CSV
      const headers = [
        'Linha',
        'SKU',
        'Nome',
        'Categoria',
        'Tipo Item',
        'Status',
        'Erros',
      ];

      // 2. Monta as linhas
      const rows = this.errors.map((error) => {
        const rowData = error.rowData || {};
        const sku = rowData['sku'] || '';
        const name = rowData['name'] || '';
        const category = rowData['categoryId'] || '';
        const itemType = rowData['itemType'] || '';
        const status = rowData['status'] || '';
        const erros = error.errorMessages.join(' | ');

        // Escapa campos que podem conter vírgulas ou quebras de linha
        const escapeField = (field: string) => {
          if (
            field.includes(',') ||
            field.includes('"') ||
            field.includes('\n')
          ) {
            return '"' + field.replace(/"/g, '""') + '"';
          }
          return field;
        };

        return [
          error.lineNumber.toString(),
          escapeField(sku),
          escapeField(name),
          escapeField(category),
          escapeField(itemType),
          escapeField(status),
          escapeField(erros),
        ].join(';');
      });

      // 3. Junta tudo com BOM para Excel (UTF-8)
      const csvContent =
        '\uFEFF' + headers.join(';') + '\r\n' + rows.join('\r\n');

      // 4. Cria o Blob e força o download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `erros_importacao_${this.jobId.substring(0, 8)}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // 5. Limpa
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.snackBar.open('CSV baixado com sucesso!', 'OK', { duration: 3000 });
      console.log('✅ [MODAL] CSV gerado e baixado');
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      this.snackBar.open('Erro ao gerar CSV', 'Fechar', { duration: 3000 });
    }
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
