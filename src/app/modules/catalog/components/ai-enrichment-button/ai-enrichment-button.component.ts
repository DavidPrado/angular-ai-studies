import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogAiService, AiEnrichmentResponse } from '../../services/catalog-ai.service';

@Component({
  selector: 'app-ai-enrichment-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <button
      mat-stroked-button
      color="primary"
      (click)="onEnrich()"
      [disabled]="loading || !hasMinimumData"
      [matTooltip]="buttonTooltip">
      
      <mat-icon *ngIf="loading" class="spin">sync</mat-icon>
      <mat-icon *ngIf="!loading">{{ buttonIcon }}</mat-icon>
      <span>{{ loading ? 'Processando...' : buttonText }}</span>
    </button>
  `,
  styles: [`
    .spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class AiEnrichmentButtonComponent {
  private readonly aiService = inject(CatalogAiService);
  private readonly snack = inject(MatSnackBar);

  @Input() productName: string = '';
  @Input() productDescription: string = '';
  @Output() enriched = new EventEmitter<AiEnrichmentResponse>();

  loading = false;

  /**
   * Verifica se tem nome suficiente para ativar a IA.
   */
  get hasMinimumData(): boolean {
    return this.productName.trim().length >= 3;
  }

  /**
   * ★ CORREÇÃO: Usa Boolean() para garantir retorno estritamente boolean.
   * O operador && pode retornar string se o primeiro operando for falsy.
   */
  get isRefining(): boolean {
    return Boolean(this.productDescription) && this.productDescription.trim().length > 5;
  }

  get buttonText(): string {
    return this.isRefining ? '✨ Refinar Descrição' : '✨ Gerar Descrição';
  }

  get buttonIcon(): string {
    return this.isRefining ? 'auto_fix_high' : 'auto_awesome';
  }

  get buttonTooltip(): string {
    return this.isRefining 
      ? 'Melhora o texto atual, tornando-o mais técnico e profissional.' 
      : 'Gera uma descrição técnica completa baseada no nome do item.';
  }

  onEnrich(): void {
    if (!this.hasMinimumData) {
      this.snack.open('Digite o nome do produto primeiro (mínimo 3 caracteres)', 'OK', { duration: 3000 });
      return;
    }

    this.loading = true;

    this.aiService.enrichProduct({
      name: this.productName,
      description: this.productDescription
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.enriched.emit(response);
        this.snack.open('✨ Descrição processada com IA!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.loading = false;
        const errorMsg = err.error?.error || 'Erro ao chamar IA. Tente novamente.';
        this.snack.open(errorMsg, 'Fechar', { duration: 5000 });
      }
    });
  }
}