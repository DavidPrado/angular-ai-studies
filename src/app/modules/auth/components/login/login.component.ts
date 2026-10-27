import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    AlertComponent,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  public readonly i18n = inject(I18nService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isLoading = false;
  errorMessage: string | null = null;
  hidePassword = true;

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('✅ Login OK, resposta:', response);
        console.log('🍪 Cookies agora:', document.cookie);
        this.router.navigate(['/v1']).then((ok) => {
          console.log('🧭 Navegação para /v1 retornou:', ok); 
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.handleLoginError(error);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private handleLoginError(error: any): void {
    console.error('Erro detalhado:', error);

    if (error.status === 0) {
      this.errorMessage = 'Servidor indisponível. Verifique sua conexão.';
      return;
    }

    if (error.error?.message) {
      this.errorMessage = error.error.message;
      return;
    }

    switch (error.status) {
      case 401:
        this.errorMessage = 'Email ou senha inválidos.';
        break;
      case 403:
        this.errorMessage = 'Acesso negado.';
        break;
      case 423:
        this.errorMessage = 'Conta bloqueada.';
        break;
      case 429:
        this.errorMessage = 'Muitas tentativas. Aguarde.';
        break;
      default:
        this.errorMessage = 'Erro ao realizar login.';
    }
  }

  changeLanguage(language: string): void {
    this.i18n.setLanguage(language as any);
  }

  get currentLanguage(): string {
    return this.i18n.getCurrentLanguage();
  }

  get currentLanguageFlag(): string {
    return (
      this.i18n.availableLanguages.find((l) => l.code === this.currentLanguage)
        ?.flag || '🇧🇷'
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  getCurrentLanguageName(): string {
    return (
      this.i18n.availableLanguages.find((l) => l.code === this.currentLanguage)
        ?.name || 'Português'
    );
  }

  get emailControl() {
    return this.loginForm.get('email');
  }
  get passwordControl() {
    return this.loginForm.get('password');
  }
}
