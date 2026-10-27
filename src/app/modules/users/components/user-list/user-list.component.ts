import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserResponse } from '../../models/user.model';
import { UserService } from '../../service/user.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  departments: string[] = [
    'TI',
    'Financeiro',
    'RH',
    'Vendas',
    'Marketing',
    'Operações',
  ];

  filterForm = new FormGroup({
    search: new FormControl(''),
    active: new FormControl(''),
    department: new FormControl(''),
  });

  displayedColumns: string[] = [
    'usuario',
    'email',
    'perfis',
    'status',
    'acoes',
  ];
  dataSource = new MatTableDataSource<UserResponse>([]);

  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadUsers();
    this.setupFilters();
  }

  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadUsers();
      });
  }

  loadUsers() {
    const filters = this.filterForm.value;

    const cleanFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    const params = {
      page: this.pageIndex.toString(),
      size: this.pageSize.toString(),
      sort: 'fullName,asc',
      ...cleanFilters,
    };

    this.userService.list(params).subscribe({
      next: (res) => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
      },
      error: (err) => {
        this.snack.open('Erro ao carregar usuários.', 'Fechar', {
          duration: 3000,
        });
        console.error(err);
      },
    });
  }

  thumbUrl(id: string): string {
    return this.userService.getThumbnailUrl(id);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      active: '',
      department: '',
    });
  }

  addUser(): void {
    this.router.navigate(['/v1/admin/usuarios/novo']);
  }

  editUser(user: UserResponse): void {
    this.router.navigate(['/v1/admin/usuarios/editar', user.id]);
  }

  deleteUser(user: UserResponse): void {
    if (confirm(`Deseja realmente excluir o usuário ${user.name}?`)) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.snack.open('Usuário removido com sucesso!', 'OK', {
            duration: 3000,
          });
          this.loadUsers();
        },
        error: () => this.snack.open('Erro ao excluir usuário.', 'Fechar'),
      });
    }
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadUsers();
  }
}
