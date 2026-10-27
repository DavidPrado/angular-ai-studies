import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { I18nService, Language } from '../../../../core/i18n/i18n.service';
import { UserService } from '../../../users/service/user.service';

// ═══ Contratos do menu ═══════════════════════════════════════════
export interface MenuEntry {
  labelKey: string;
  descKey: string;
  icon: string;
  /** Ausente = item-pai que só expande/recolhe. */
  route?: string;
  /** false = badge "em breve", sem navegação. */
  available?: boolean;
  /** Submenu (filhos). */
  children?: MenuEntry[];
  /** Termos de busca fixos (pt/en/es) — não depende do I18nService. */
  searchTerms: string[];
}

export interface MenuZone {
  labelKey: string;
  entries: MenuEntry[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private i18nService = inject(I18nService);
  private router = inject(Router);
  private userService = inject(UserService);

  avatarUrl = this.userService.getMyThumbnailUrl() + '?v=' + Date.now();
  hasPhoto = true;
  zoneExpanded: Record<string, boolean> = {};

  zones: MenuZone[] = [
    {
      labelKey: 'menu.registers',
      entries: [
        {
          labelKey: 'menu.catalog',
          descKey: 'menu.catalog_desc',
          icon: 'inventory_2',
          searchTerms: [
            'catalogo',
            'catalog',
            'produtos',
            'products',
            'servicos',
            'services',
          ],
          children: [
            {
              labelKey: 'menu.catalog_items',
              descKey: 'menu.catalog_items_desc',
              icon: 'sell',
              route: '/v1/catalogo',
              searchTerms: ['produtos', 'servicos', 'itens', 'items'],
            },
            {
              labelKey: 'menu.catalog_categories',
              descKey: 'menu.catalog_categories_desc',
              icon: 'category',
              route: '/v1/catalogo/categorias',
              searchTerms: ['categorias', 'categories', 'secoes'],
            },
          ],
        },
        {
          labelKey: 'menu.partners',
          descKey: 'menu.partners_desc',
          icon: 'handshake',
          available: false,
          searchTerms: [
            'clientes',
            'fornecedores',
            'customers',
            'suppliers',
            'parceiros',
          ],
        },
        {
          labelKey: 'menu.organization',
          descKey: 'menu.organization_desc',
          icon: 'apartment',
          available: false,
          searchTerms: [
            'organizacao',
            'organization',
            'estabelecimentos',
            'centro de custo',
          ],
        },
      ],
    },
    {
      labelKey: 'menu.operation',
      entries: [
        {
          labelKey: 'menu.operations_center',
          descKey: 'menu.operations_center_desc',
          icon: 'sync',
          route: '/v1/operacoes',
          searchTerms: [
            'operacoes',
            'operations',
            'importacao',
            'exportacao',
            'bulk',
          ],
        },
        {
          labelKey: 'menu.sales',
          descKey: 'menu.sales_desc',
          icon: 'point_of_sale',
          available: false,
          searchTerms: ['vendas', 'sales', 'pedidos', 'orders', 'orcamentos'],
        },
        {
          labelKey: 'menu.inventory',
          descKey: 'menu.inventory_desc',
          icon: 'warehouse',
          available: false,
          searchTerms: ['estoque', 'inventory', 'saldos', 'movimentacoes'],
        },
        {
          labelKey: 'menu.financial',
          descKey: 'menu.financial_desc',
          icon: 'payments',
          searchTerms: ['financeiro', 'financial', 'contas'],
          children: [
            {
              labelKey: 'menu.fin_payable',
              descKey: 'menu.fin_payable_desc',
              icon: 'outbox',
              route: '/v1/financeiro/pagar',
              available: false,
              searchTerms: ['pagar', 'payable', 'contas a pagar'],
            },
            {
              labelKey: 'menu.fin_receivable',
              descKey: 'menu.fin_receivable_desc',
              icon: 'inbox',
              route: '/v1/financeiro/receber',
              available: false,
              searchTerms: ['receber', 'receivable', 'contas a receber'],
            },
          ],
        },
        {
          labelKey: 'menu.fiscal',
          descKey: 'menu.fiscal_desc',
          icon: 'description',
          searchTerms: ['fiscal', 'notas', 'nfe', 'impostos', 'tax'],
        },
      ],
    },
    {
      labelKey: 'menu.admin',
      entries: [
        {
          labelKey: 'menu.users',
          descKey: 'menu.users_desc',
          icon: 'group',
          route: '/v1/admin/usuarios',
          searchTerms: ['usuarios', 'users', 'pessoas', 'funcionarios'],
        },
        {
          labelKey: 'menu.profile',
          descKey: 'menu.profile_desc',
          icon: 'account_circle',
          route: '/v1/admin/perfis',
          searchTerms: ['perfis', 'profiles', 'papeis', 'roles'],
        },
        {
          labelKey: 'menu.permissions',
          descKey: 'menu.permissions_desc',
          icon: 'verified_user',
          route: '/v1/admin/permissoes',
          searchTerms: ['permissoes', 'permissions'],
        },
        {
          labelKey: 'menu.tenants',
          descKey: 'menu.tenants_desc',
          icon: 'business',
          route: '/v1/admin/tenants',
          searchTerms: ['tenants', 'empresas', 'companies'],
        },
      ],
    },
  ];

  visibleZones: MenuZone[] = this.zones;

  expanded: Record<string, boolean> = {};

  private searchActive = false;

  ngOnInit(): void {
    const url = this.router.url;
    for (const zone of this.zones) {
      for (const entry of zone.entries) {
        if (entry.children?.length) {
          this.expanded[entry.labelKey] = entry.children.some(
            (c) => !!c.route && url.startsWith(c.route),
          );
        }
      }
    }
  }

  onSearch(raw: string): void {
    const term = (raw || '').trim().toLowerCase();
    this.searchActive = !!term;

    if (!term) {
      this.visibleZones = this.zones;
      return;
    }

    this.visibleZones = this.zones
      .map((zone) => {
        const entries = zone.entries
          .map((entry) => {
            const selfMatch = this.matches(entry, term);
            const kids = (entry.children ?? []).filter((c) =>
              this.matches(c, term),
            );
            if (selfMatch) return { ...entry };
            if (kids.length) return { ...entry, children: kids };
            return null;
          })
          .filter((e): e is MenuEntry => e !== null);
        return { ...zone, entries };
      })
      .filter((zone) => zone.entries.length > 0);
  }

  private matches(entry: MenuEntry, term: string): boolean {
    return (
      entry.searchTerms.some((t) => t.includes(term)) ||
      entry.labelKey.toLowerCase().includes(term)
    );
  }

  isExpanded(entry: MenuEntry): boolean {
    return this.searchActive || !!this.expanded[entry.labelKey];
  }

  toggle(entry: MenuEntry): void {
    this.expanded[entry.labelKey] = !this.expanded[entry.labelKey];
  }

  trackByLabelKey(_: number, item: MenuEntry): string {
    return item.labelKey;
  }

  onAvatarError(): void {
    this.hasPhoto = false;
  }

  changeLang(lang: Language) {
    this.i18nService.setLanguage(lang);
  }

  get isHome(): boolean {
    return this.router.url === '/v1' || this.router.url === '/v1/';
  }

  isAdminRoute(): boolean {
    const url = this.router.url;
    return (
      url.includes('admin') ||
      url.includes('usuarios') ||
      url.includes('permissoes') ||
      url.includes('perfil')
    );
  }
}
