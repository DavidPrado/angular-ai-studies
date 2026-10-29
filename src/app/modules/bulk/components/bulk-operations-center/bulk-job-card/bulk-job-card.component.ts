import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { BulkJob } from '../../../models/bulk-job.model';

/**
 * Card reutilizável para exibir um job na lista.
 * Mostra entidade, status, progresso e ações contextuais.
 */
@Component({
  selector: 'app-bulk-job-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './bulk-job-card.component.html',
  styleUrls: ['./bulk-job-card.component.scss'],
})
export class BulkJobCardComponent {
  @Input() job!: BulkJob;
  @Output() cancel = new EventEmitter<BulkJob>();
  @Output() viewErrors = new EventEmitter<string>();

  onCancel(): void {
    this.cancel.emit(this.job);
  }

  formatRemaining(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  getProgressBarMode(): 'determinate' | 'indeterminate' {
    if (this.job.status === 'PROCESSING' && this.job.progressPercent === 0) {
      return 'indeterminate';
    }
    return 'determinate';
  }

  getProgressBarColor(): string {
    switch (this.job.status) {
      case 'DONE':
        return 'accent';
      case 'FAILED':
        return 'warn';
      case 'PARTIAL':
        return 'accent';
      default:
        return 'primary';
    }
  }

  canCancel(): boolean {
    return this.job.status === 'QUEUED' || this.job.status === 'PROCESSING';
  }

  isTerminal(): boolean {
    return ['DONE', 'PARTIAL', 'FAILED', 'CANCELLED'].includes(this.job.status);
  }

  getOperationIcon(): string {
    return this.job.operation.startsWith('IMPORT') ? 'upload' : 'download';
  }

  getOperationLabel(): string {
    const labels: Record<string, string> = {
      IMPORT_JSON: 'Importação JSON',
      IMPORT_CSV: 'Importação CSV',
      EXPORT_CSV: 'Exportação CSV',
      EXPORT_XLSX: 'Exportação Excel',
    };
    return labels[this.job.operation] || this.job.operation;
  }

  getStatusClass(): string {
    const map: Record<string, string> = {
      QUEUED: 'status-queued',
      PROCESSING: 'status-processing',
      CANCELLING: 'status-cancelling',
      CANCELLED: 'status-cancelled',
      DONE: 'status-done',
      PARTIAL: 'status-partial',
      FAILED: 'status-failed',
    };
    return map[this.job.status] || '';
  }

  onViewErrors() {
    this.viewErrors.emit(this.job.id);
  }
}
