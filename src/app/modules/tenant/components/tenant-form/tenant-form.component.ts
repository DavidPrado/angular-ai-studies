import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TenantService } from '../../service/tenant.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.scss',
})
export class TenantFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  tenantForm!: FormGroup;
  isEditMode = false;
  tenantId?: string;

  countries = [
    { code: 'BRA', name: 'Brasil', currency: 'BRL' },
    { code: 'USA', name: 'United States', currency: 'USD' },
    { code: 'PRT', name: 'Portugal', currency: 'EUR' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.tenantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      subdomain: [
        '',
        [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)],
      ],
      country: ['BRA', Validators.required], // Atualizado para o padrão de 3 letras
      currencyCode: ['BRL', Validators.required],
      active: [true],
    });

    this.tenantForm.get('country')?.valueChanges.subscribe((countryCode) => {
      const selected = this.countries.find((c) => c.code === countryCode);
      if (selected)
        this.tenantForm.get('currencyCode')?.setValue(selected.currency);
    });
  }

  private checkEditMode(): void {
    this.tenantId = this.route.snapshot.params['id'];
    if (this.tenantId) {
      this.isEditMode = true;
      this.tenantService.findById(this.tenantId).subscribe({
        next: (tenant) => this.tenantForm.patchValue(tenant),
        error: () => this.snack.open('Erro ao carregar Tenant', 'Fechar'),
      });
    }
  }

  save(): void {
    if (this.tenantForm.invalid) return;

    const request = this.tenantForm.value;

    const operation: Observable<any> = this.isEditMode
      ? this.tenantService.update(this.tenantId!, request)
      : this.tenantService.create(request);

    operation.subscribe({
      next: () => {
        this.snack.open(
          `Tenant ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`,
          'OK',
          { duration: 3000 },
        );
        this.router.navigate(['/v1/admin/tenants']);
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Erro ao salvar dados.';
        this.snack.open(msg, 'Fechar', { duration: 5000 });
      },
    });
  }
}
