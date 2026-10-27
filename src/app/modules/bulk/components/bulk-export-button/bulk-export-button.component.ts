import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpResponse } from '@angular/common/http';
import { BulkService } from '../../services/bulk.service';

/**
 * ============================================================
 * Botão genérico de exportação com menu dropdown (CSV / Excel).
 * ============================================================
 *
 * Desenvolvido UMA vez, usado em TODO o sistema:
 *   <app-bulk-export entity="catalog-items" [paramsProvider]="filtrosAtuais" />
 *   <app-bulk-export entity="parties"        [paramsProvider]="filtrosAtuais" />
 *
 * Encapsula:
 * - Menu dropdown com opções CSV e Excel
 * - Spinner visual durante exportação
 * - Guarda de clique duplo (evita downloads duplicados)
 * - Download do blob via BulkService.saveBlob()
 * - Snacks de sucesso / vazio / erro em pt-BR
 *
 * Por que um único componente?
 * → Evita duplicação de lógica (spinner, guarda, snacks, erro)
 * → Usuário escolhe formato num único lugar (UX consistente)
 * → Adicionar novo formato (PDF futuro) = só 1 linha no menu
 * ============================================================
 */
@Component({
  selector: 'app-bulk-export',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, // ★ Necessário para mat-stroked-button
    MatIconModule,
    MatMenuModule, // ★ Necessário para mat-menu (dropdown)
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <!--
      Botão principal: abre o menu dropdown.
      - Desabilitado durante exportação (evita clique duplo)
      - Mostra spinner girando enquanto exporta
      - Tooltip explica o que o botão faz
    -->
    <button
      mat-stroked-button
      [matMenuTriggerFor]="exportMenu"
      [disabled]="exporting"
      matTooltip="Exportar dados da listagem atual em CSV ou Excel"
      aria-label="Exportar"
    >
      <mat-icon [class.spin]="exporting">
        {{ exporting ? 'progress_activity' : 'download' }}
      </mat-icon>
      {{ exporting ? 'Exportando...' : label }}
    </button>

    <!--
      Menu dropdown com opções de formato.
      Cada opção chama método específico (exportCsv / exportXlsx).
      No futuro: adicionar mais <button mat-menu-item> para novos formatos.
    -->
    <mat-menu #exportMenu="matMenu">
      <button mat-menu-item (click)="exportCsv()">
        <mat-icon>description</mat-icon>
        <span>CSV (Excel pt-BR)</span>
      </button>
      <button mat-menu-item (click)="exportXlsx()">
        <mat-icon>table_chart</mat-icon>
        <span>Excel (.xlsx)</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      /* Botão alinhado com "Novo Item" da tela de catálogo */
      :host {
        display: inline-block;
      }

      :host button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px; /* MESMO padding do btn-new */
        border-radius: 8px; /* MESMO border-radius */
        font-weight: 600;
        font-size: 14px; /* MESMO font-size */
        background: white;
        border: 1px solid #dee2e6;
        color: #525f7f;
        height: 48px; /* Altura fixa para alinhar */
        min-width: 140px; /* Largura mínima consistente */
        justify-content: center; /* Centraliza conteúdo */
        transition: all 0.25s;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11);
      }

      /* Hover: borda azul sutil (igual btn-new) */
      :host button:hover:not(:disabled) {
        background: #f0f3ff;
        border-color: #5e72e4;
        color: #324cdd;
        transform: translateY(-2px);
      }

      /* Estado desabilitado durante exportação */
      :host button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }

      /* Ícone do Material */
      :host button mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* Animação de rotação durante exportação */
      .spin {
        animation: export-spin 1s linear infinite;
      }

      @keyframes export-spin {
        to {
          transform: rotate(360deg);
        }
      }

      ::ng-deep .mat-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
      }
    `,
  ],
})
export class BulkExportButtonComponent {
  /** Serviço genérico de bulk (CSV + Excel). */
  private readonly bulk = inject(BulkService);

  /** Snack para feedback visual ao usuário. */
  private readonly snack = inject(MatSnackBar);

  /**
   * Nome canônico da entidade no SPI do backend.
   * Ex.: 'catalog-items', 'parties', 'stock-balances'.
   * Backend usa esse nome para rotear ao handler correto.
   */
  @Input({ required: true }) entity!: string;

  /**
   * Rótulo do botão (padrão: 'Exportar').
   * Permite customização por tela (ex.: "Exportar clientes").
   */
  @Input() label = 'Exportar';

  /**
   * Função que fornece filtros ATUAIS da tela no momento do clique.
   *
   * Na tela hospedeira, passe como arrow function:
   *   readonly filtrosAtuais = () => this.buildParams();
   *
   * Por que função e não objeto direto?
   * → Garante filtros lidos NO MOMENTO do clique (não no render)
   * → Se usuário mudar filtros entre abrir menu e clicar, export reflete estado atual
   */
  @Input() paramsProvider: () => Record<string, string> = () => ({});

  /**
   * Guarda de clique duplo durante download.
   * Enquanto true, botão fica desabilitado e novos cliques são ignorados.
   */
  exporting = false;

  /**
   * ============================================================
   * Exporta em CSV.
   * ============================================================
   * Delega para doExport() com formato 'csv'.
   * BulkService chama GET /v1/bulk/{entity}/export?format=csv.
   */
  exportCsv(): void {
    this.doExport('csv');
  }

  /**
   * ============================================================
   * Exporta em Excel (.xlsx).
   * ============================================================
   * Delega para doExport() com formato 'xlsx'.
   * BulkService chama GET /v1/bulk/{entity}/export?format=xlsx.
   */
  exportXlsx(): void {
    this.doExport('xlsx');
  }

  /**
   * ============================================================
   * Lógica comum de exportação (CSV e Excel).
   * ============================================================
   *
   * Fluxo:
   * 1. Verifica se já está exportando (guarda de clique duplo)
   * 2. Marca exporting = true (ativa spinner + desabilita botão)
   * 3. Chama BulkService.exportCsv() ou exportXlsx()
   * 4. No sucesso:
   *    - 204 ou blob vazio → snack "Nada para exportar..."
   *    - blob válido → saveBlob() dispara download + snack com filename
   * 5. No erro:
   *    - Tenta extrair mensagem pt-BR do backend (BusinessException)
   *    - Fallback para mensagem genérica
   * 6. Sempre: reseta exporting = false
   *
   * @param format 'csv' ou 'xlsx'
   */
  private doExport(format: 'csv' | 'xlsx'): void {
    // Guarda: ignora cliques enquanto já está exportando
    if (this.exporting) return;
    this.exporting = true;

    // Escolhe método do BulkService baseado no formato
    // Ambos retornam Observable<HttpResponse<Blob>>
    const request$ =
      format === 'csv'
        ? this.bulk.exportCsv(this.entity, this.paramsProvider())
        : this.bulk.exportXlsx(this.entity, this.paramsProvider());

    request$.subscribe({
      next: (res) => {
        this.exporting = false;

        // Caso 1: 204 No Content ou blob vazio → nada para exportar
        if (res.status === 204 || !res.body || res.body.size === 0) {
          this.snack.open('Nada para exportar com os filtros atuais.', 'OK', {
            duration: 3000,
          });
          return;
        }

        // Caso 2: sucesso → dispara download e mostra snack com filename
        const filename = this.bulk.saveBlob(res);
        this.snack.open(`Exportação concluída: ${filename}`, 'OK', {
          duration: 3500,
        });
      },
      error: async (err) => {
        this.exporting = false;

        // Tenta extrair mensagem de erro do backend (BusinessException)
        // Backend retorna JSON { message: "..." } dentro de Blob quando há erro
        let message = 'Erro ao exportar. Tente novamente.';
        if (err.error instanceof Blob) {
          try {
            const text = await err.error.text();
            const parsed = JSON.parse(text);
            message = parsed.message ?? message;
          } catch {
            /* mantém mensagem padrão se não conseguir parsear */
          }
        } else {
          message = err?.error?.message ?? message;
        }

        this.snack.open(message, 'Fechar', { duration: 4500 });
      },
    });
  }
}
