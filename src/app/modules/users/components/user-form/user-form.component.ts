import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: string | null = null;
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  availableRoles: { id: string; name: string; displayName: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) {
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      registrationNumber: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      secondaryPhone: [''],
      department: [''],
      costCenter: [''],
      position: [''],
      password: [''],
      active: [true],
      roleIds: [[], [Validators.required]],
      tenantId: [''],
      mustChangePassword: [false],
      passwordExpirationDays: [90],
      isTemporary: [false],
      accessStartDate: [null],
      accessEndDate: [null],
      autoDeactivate: [true],
      allowedIpAddresses: [''],
    });
  }
  ngOnInit(): void {
    this.loadRoles();
    this.userId = this.route.snapshot.paramMap.get('id');
    this.setupTemporaryValidation();

    if (this.userId) {
      this.isEditMode = true;
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.loadUser(this.userId);
    } else {
      this.userForm.get('password')?.setValidators([Validators.required]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  private setupTemporaryValidation() {
    this.userForm
      .get('isTemporary')
      ?.valueChanges.subscribe((isTemp: boolean) => {
        const startDateCtrl = this.userForm.get('accessStartDate');
        const endDateCtrl = this.userForm.get('accessEndDate');

        if (isTemp) {
          endDateCtrl?.setValidators([Validators.required]);
        } else {
          startDateCtrl?.setValue(null);
          endDateCtrl?.clearValidators();
          endDateCtrl?.setValue(null);
        }
        endDateCtrl?.updateValueAndValidity();
      });
  }

  loadUser(id: string): void {
    this.userService.getById(id).subscribe({
      next: (user: any) => {
        this.userForm.patchValue({
          fullName: user.name || '',
          registrationNumber: user.employeeCode || '',
          email: user.email || '',
          phoneNumber: user.phone || '',
          secondaryPhone: user.phoneNumber2 || '',
          department: user.department || '',
          costCenter: user.costCenter || '',
          position: user.jobTitle || '',
          active: user.active ?? true,
          tenantId: user.tenant?.id || '',
          roleIds: user.roles ? user.roles.map((r: any) => r.id) : [],
          mustChangePassword: user.requirePasswordChange || false,
          passwordExpirationDays: user.passwordChangeIntervalDays || 90,
          isTemporary: user.isTemporary || false,
          accessStartDate: this.formatDateForInput(user.createdAt),
          accessEndDate: this.formatDateForInput(user.expiresAt),
          autoDeactivate: user.isTemporary ?? true,
          allowedIpAddresses: '',
        });

        if (user.hasProfilePicture && user.id) {
          this.previewUrl = user.hasProfilePicture
            ? this.userService.getThumbnailUrl(user.id) + '?v=' + Date.now()
            : null;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar dados do usuário:', err);
        this.snack.open('Erro ao carregar dados do usuário.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  private formatDateForInput(dateStr: any): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  navigateToList() {
    this.router.navigate(['/v1/admin/usuarios']);
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const tenantId = this.authService.getCurrentTenantId();

    if (!tenantId) {
      console.error('Nenhum tenantId encontrado na sessão do usuário logado!');
      this.snack.open('Erro: Tenant não identificado.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    const rawValues = this.userForm.value;

    const payload = {
      fullName: rawValues.fullName,
      email: rawValues.email,
      phoneNumber: rawValues.phoneNumber || null,
      phoneNumber2: rawValues.secondaryPhone || null,
      department: rawValues.department || null,
      position: rawValues.position || null,
      costCenter: rawValues.costCenter || null,
      employeeCode: rawValues.registrationNumber || null,
      active: rawValues.active ?? true,
      requirePasswordChange: rawValues.mustChangePassword ?? false, // ← CORRIGIDO
      isTemporary: rawValues.isTemporary || false,
      expiresAt: rawValues.accessEndDate // ← CORRIGIDO
        ? new Date(rawValues.accessEndDate).toISOString()
        : null,
      passwordChangeIntervalDays: rawValues.passwordExpirationDays || 90,
      password: rawValues.password || null,
      tenantId: tenantId,
      roleIds: rawValues.roleIds || [],
    };

    const request$: Observable<any> =
      this.isEditMode && this.userId
        ? this.userService.update(this.userId, payload)
        : this.userService.create(payload);

    request$.subscribe({
      next: (response: any) => {
        const targetUserId = this.isEditMode
          ? this.userId!
          : response?.id || response?.data?.id;

        if (this.selectedFile && targetUserId) {
          this.userService
            .uploadProfilePicture(targetUserId, this.selectedFile)
            .subscribe({
              next: () => this.navigateToList(),
              error: () => this.navigateToList(),
            });
        } else {
          this.snack.open('Usuário salvo com sucesso!', 'OK', {
            duration: 3000,
          });
          this.navigateToList();
        }
      },
      error: (err) => {
        console.error('Erro ao salvar usuário:', err);
        this.snack.open('Erro ao salvar usuário.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  private loadRoles(): void {
    this.userService.listRoles({ size: '100' }).subscribe({
      next: (page: any) => {
        this.availableRoles = (page.content ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
        }));
      },
      error: (err) => {
        console.error('Erro ao carregar perfis:', err);
        this.snack.open('Erro ao carregar perfis de acesso.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }
}
