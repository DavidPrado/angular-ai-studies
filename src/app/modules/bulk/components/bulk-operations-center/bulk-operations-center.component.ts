import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, interval, startWith } from 'rxjs';
import { BulkImportService } from '../../services/bulk-import.service';
import { BulkJob, BulkJobStatus } from '../../models/bulk-job.model';
import { BulkJobCardComponent } from './bulk-job-card/bulk-job-card.component';

@Component({
  selector: 'app-bulk-operations-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BulkJobCardComponent,
  ],
  templateUrl: './bulk-operations-center.component.html',
  styleUrl: './bulk-operations-center.component.scss',
})
export class BulkOperationsCenterComponent implements OnInit, OnDestroy {
  private readonly importService = inject(BulkImportService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  

  jobs: BulkJob[] = [];
  filteredJobs: BulkJob[] = [];
  statusFilter: BulkJobStatus | 'ALL' = 'ALL';
  operationFilter: 'IMPORT' | 'EXPORT' | 'ALL' = 'ALL';
  loading = true;
  isPolling = false;

  ngOnInit(): void {
    this.loadJobs();
    this.startSmartPolling();
  }

  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadJobs(): void {
    this.importService
      .listUserJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          this.jobs = jobs;
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.snack.open('Erro ao carregar operações', 'Fechar', {
            duration: 3000,
          });
          this.loading = false;
        },
      });
  }

  private startSmartPolling(): void {
    interval(3000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => {
        const hasActiveJobs = this.jobs.some((job) =>
          ['PROCESSING', 'QUEUED', 'CANCELLING'].includes(job.status),
        );

        if (hasActiveJobs) {
          this.isPolling = true;
          this.loadJobs();
        } else {
          this.isPolling = false;
        }
      });
  }

  applyFilters(): void {
    this.filteredJobs = this.jobs.filter((job) => {
      if (this.statusFilter !== 'ALL' && job.status !== this.statusFilter) {
        return false;
      }
      if (this.operationFilter !== 'ALL') {
        const isImport = job.operation.startsWith('IMPORT');
        if (this.operationFilter == 'IMPORT' && !isImport) return false;
        if (this.operationFilter == 'EXPORT' && !isImport) return false;
      }
      return true;
    });
  }

  clearFilters(): void {
    this.statusFilter = 'ALL';
    this.operationFilter = 'ALL';
    this.applyFilters();
  }

  cancelJob(job: BulkJob): void {
    if (!confirm(`Deseja cancelar a operação "${job.entity}"?`)) {
      return;
    }

    this.importService
      .cancelJob(job.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snack.open('Cancelamento solicitado', 'OK', { duration: 3000 });
          this.loadJobs();
        },
        error: (err) => {
          this.snack.open(err.error?.error || 'Erro ao cancelar', 'Fechar', {
            duration: 4500,
          });
        },
      });
  }

  formatDate(isoString: string | null): string {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: BulkJobStatus): string {
    const colors: Record<BulkJobStatus, string> = {
      QUEUED: 'accent',
      PROCESSING: 'primary',
      CANCELLING: 'warn',
      CANCELLED: '',
      DONE: 'primary',
      PARTIAL: 'accent',
      FAILED: 'warn',
    };
    return colors[status] || '';
  }

  getStatusIcon(status: BulkJobStatus): string {
    const icons: Record<BulkJobStatus, string> = {
      QUEUED: 'schedule',
      PROCESSING: 'sync',
      CANCELLING: 'cancel',
      CANCELLED: 'cancel',
      DONE: 'check_circle',
      PARTIAL: 'warning',
      FAILED: 'error',
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: BulkJobStatus): string {
    const labels: Record<BulkJobStatus, string> = {
      QUEUED: 'Na fila',
      PROCESSING: 'Processando',
      CANCELLING: 'Cancelando',
      CANCELLED: 'Cancelado',
      DONE: 'Concluído',
      PARTIAL: 'Parcial',
      FAILED: 'Falhou',
    };
    return labels[status] || status;
  }

  getActiveJobsCount(): number {
    return this.jobs.filter((j) =>
      ['QUEUED', 'PROCESSING', 'CANCELLING'].includes(j.status),
    ).length;
  }

  getSuccessJobsCount(): number {
    return this.jobs.filter((j) => j.status === 'DONE').length;
  }

  getFailedJobsCount(): number {
    return this.jobs.filter((j) => ['FAILED', 'PARTIAL'].includes(j.status))
      .length;
  }
}
