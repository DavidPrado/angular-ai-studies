import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';

interface ManualSection {
  title: string;
  icon: string;
  content: string[];
  tips?: string[];
  warnings?: string[];
}

interface ManualTopic {
  title: string;
  description: string;
  icon: string;
  sections: ManualSection[];
}

@Component({
  selector: 'app-catalog-manual',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    RouterLink,
  ],
  templateUrl: './catalog-manual.component.html',
  styleUrl: './catalog-manual.component.scss',
})
export class CatalogManualComponent {
  panelOpenState = true;

  topics: ManualTopic[] = [
    {
      title: 'O que é o Catálogo?',
      description: 'Entenda o propósito do módulo de catálogo',
      icon: 'inventory_2',
      sections: [
        {
          title: 'Visão Geral',
          icon: 'info',
          content: [
            'O Catálogo é o coração do seu ERP, onde você gerencia todos os produtos e serviços.',
            'Aqui você pode cadastrar itens, organizar por categorias, definir preços e dados fiscais.',
            'O sistema suporta tanto produtos físicos quanto serviços, cada um com suas características.',
          ],
          tips: [
            'Use categorias para organizar melhor seus itens',
            'Mantenha sempre o estoque atualizado para produtos físicos',
            'Preencha todos os dados fiscais para evitar problemas na emissão de notas',
          ],
        },
      ],
    },
    {
      title: 'Cadastro de Itens',
      description: 'Como criar e editar produtos e serviços',
      icon: 'add_circle',
      sections: [
        {
          title: 'Criando um Novo Item',
          icon: 'add_box',
          content: [
            'Clique no botão "Novo Item" no canto superior direito da tela.',
            'Preencha o SKU (código único) - este campo é obrigatório e imutável.',
            'Informe o nome, descrição e tipo (Produto ou Serviço).',
            'Selecione a categoria adequada e defina os preços de venda e custo.',
            'Preencha os dados fiscais (NCM, CEST, CSOSN) conforme necessário.',
          ],
          tips: [
            'O SKU deve ser único (ex: ELE-COMP-NOT-001)',
            'Para serviços, os campos de controle de estoque são desabilitados automaticamente',
          ],
          warnings: [
            'Campos obrigatórios: SKU, Nome, Tipo, Status e Preço de Venda',
            'Não utilize caracteres especiais no SKU',
          ],
        },
        {
          title: 'Editando um Item Existente',
          icon: 'edit',
          content: [
            'Na lista de itens, clique no ícone de "Editar" (lápis) ao lado do item.',
            'Altere os campos necessários (o SKU não pode ser alterado).',
            'Clique em "Atualizar" para salvar as mudanças.',
          ],
        },
      ],
    },
    {
      title: 'Busca Inteligente com IA',
      description: 'Como usar a busca semântica avançada',
      icon: 'psychology',
      sections: [
        {
          title: 'Busca por Significado',
          icon: 'search',
          content: [
            'O sistema usa Inteligência Artificial para entender o contexto da sua busca.',
            'Digite termos relacionados, mesmo que não estejam no nome ou SKU.',
            'Exemplo: Buscar "fritar sem óleo" encontrará "Fritadeira Elétrica Air Fryer".',
          ],
          tips: [
            'Use termos do dia a dia, não precisa ser técnico',
            'A busca considera sinônimos e conceitos relacionados automaticamente',
          ],
          warnings: [
            'Resultados com menos de 70% de similaridade não são exibidos para manter a precisão',
          ],
        },
      ],
    },
    {
      title: 'Importação em Massa (CSV)',
      description: 'Como importar múltiplos itens de forma rápida',
      icon: 'upload_file',
      sections: [
        {
          title: 'Preparando o Arquivo',
          icon: 'description',
          content: [
            'Clique em "Importar" e depois em "Baixar Modelo" para obter o template correto.',
            'O arquivo deve ser CSV com separador ponto-e-vírgula (;).',
            'Preencha as colunas obrigatórias: sku, name, itemType, status, salePrice.',
            'Para preços, use vírgula como separador decimal (ex: 1299,90).',
          ],
          tips: [
            'Use o template fornecido para garantir o formato exato das colunas',
            'Máximo recomendado: 1000 itens por arquivo para melhor performance',
          ],
          warnings: [
            'Linhas com erros de validação não impedem as demais de serem importadas',
            'Você receberá um relatório detalhado dos itens que falharam',
          ],
        },
        {
          title: 'Acompanhando o Processo',
          icon: 'sync',
          content: [
            'Após iniciar, você será direcionado para a Central de Operações.',
            'O job aparecerá com status "Em Processamento" e barra de progresso.',
            'Ao finalizar, o status mudará para "Concluído" (verde) ou "Parcial" (laranja).',
            'Se houver erros, clique no job para ver o relatório e baixar o CSV de correção.',
          ],
        },
      ],
    },
    {
      title: 'Exportação de Dados',
      description: 'Como exportar seu catálogo para planilhas',
      icon: 'download',
      sections: [
        {
          title: 'Exportando o Catálogo',
          icon: 'file_download',
          content: [
            'Clique no botão "Exportar" no canto superior direito.',
            'Escolha o formato: CSV (Excel pt-BR) ou Excel (.xlsx).',
            'Os filtros aplicados na lista (categoria, status, etc.) serão respeitados na exportação.',
            'O download do arquivo iniciará automaticamente no seu navegador.',
          ],
          tips: [
            'Use filtros para exportar apenas categorias ou tipos específicos',
            'O arquivo vem formatado e pronto para uso imediato no Excel',
          ],
        },
      ],
    },
  ];

  quickLinks = [
    { label: 'Importar CSV', icon: 'upload_file', route: '/v1/catalogo' },
    { label: 'Exportar Dados', icon: 'download', route: '/v1/catalogo' },
    { label: 'Categorias', icon: 'category', route: '/v1/catalogo/categorias' },
    { label: 'Novo Item', icon: 'add_circle', route: '/v1/catalogo/novo' },
  ];
}