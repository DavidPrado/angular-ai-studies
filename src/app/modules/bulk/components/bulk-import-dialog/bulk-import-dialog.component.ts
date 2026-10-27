import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../assets/environments/environment';

@Component({
  selector: 'app-bulk-import-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="import-dialog">
      <h2 mat-dialog-title>Importar em Massa</h2>
      
      <mat-dialog-content>
        <p class="subtitle">Selecione um arquivo CSV com os dados dos itens.</p>
        
        <button mat-stroked-button color="primary" (click)="downloadTemplate()" class="btn-template">
          <mat-icon>download</mat-icon>
          Baixar Modelo (Template) CSV
        </button>

        <div class="upload-area" 
             (click)="fileInput.click()"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)">
          <mat-icon>cloud_upload</mat-icon>
          <span *ngIf="!selectedFile">Clique ou arraste o arquivo CSV aqui</span>
          <span *ngIf="selectedFile" class="file-name">{{ selectedFile.name }}</span>
          <input type="file" #fileInput accept=".csv" hidden (change)="onFileSelected($event)">
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Cancelar</button>
        <button mat-raised-button color="primary" [disabled]="!selectedFile || uploading" (click)="upload()">
          <mat-icon *ngIf="uploading" class="spin">sync</mat-icon>
          {{ uploading ? 'Enviando...' : 'Iniciar Importação' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .import-dialog { min-width: 450px; }
    .subtitle { color: #8898aa; margin-bottom: 16px; font-size: 14px; }
    .btn-template { width: 100%; margin-bottom: 20px; justify-content: flex-start; }
    
    .upload-area {
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #8898aa;
      background: #fafbfc;
    }
    .upload-area:hover { 
      border-color: #5e72e4; 
      background: #f4f6f9; 
      color: #5e72e4; 
    }
    .upload-area mat-icon { 
      font-size: 48px; 
      width: 48px; 
      height: 48px; 
      margin-bottom: 12px; 
    }
    .file-name { 
      font-weight: 600; 
      color: #32325d; 
      display: block; 
      margin-top: 8px; 
      word-break: break-all;
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class BulkImportDialogComponent {
  readonly dialogRef = inject(MatDialogRef<BulkImportDialogComponent>);
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);

  selectedFile: File | null = null;
  uploading = false;
  entity = 'catalog-items'; // Entidade alvo

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      this.selectedFile = file;
    } else {
      this.snack.open('Por favor, selecione um arquivo .csv válido', 'Fechar', { duration: 3000 });
    }
  }

  onDragOver(event: DragEvent): void { 
    event.preventDefault(); 
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      this.selectedFile = file;
    }
  }

  downloadTemplate(): void {
    this.http.get<any[]>(
      `${environment.api.baseUrl}/${environment.api.version}/bulk/${this.entity}/template`, 
      { withCredentials: true }
    ).subscribe({
      next: (data) => {
        // Converte o JSON do template em CSV real para download
        const headers = Object.keys(data[0]).join(';');
        const row = Object.values(data[1]).join(';');
        // \uFEFF é o BOM para o Excel abrir corretamente com acentos
        const csvContent = `\uFEFF${headers}\n${row}`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `modelo_${this.entity}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.snack.open('Modelo baixado com sucesso!', 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Erro ao baixar modelo', 'Fechar', { duration: 3000 })
    });
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(
      `${environment.api.baseUrl}/${environment.api.version}/bulk/${this.entity}/import/csv?mode=UPSERT`, 
      formData, 
      { withCredentials: true }
    ).subscribe({
      next: (res: any) => {
        this.snack.open(res.message || 'Importação iniciada com sucesso!', 'OK', { duration: 4000 });
        this.dialogRef.close(true); // Fecha e avisa o pai para atualizar a lista ou redirecionar
      },
      error: (err) => {
        this.snack.open(err.error?.error || 'Erro no upload do arquivo', 'Fechar', { duration: 5000 });
        this.uploading = false;
      }
    });
  }
}