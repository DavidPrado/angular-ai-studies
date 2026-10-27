import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { LoginRequest, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  currentUser = signal<LoginResponse | null>(
    JSON.parse(localStorage.getItem('user_profile') || 'null'),
  );

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        const userSession: LoginResponse = {
          userName: response.userName,
          tenantId: response.tenantId,
          roles: response.roles,
          type: response.type,
          expiresIn: response.expiresIn,
        };

        localStorage.setItem('user_profile', JSON.stringify(userSession));
        localStorage.setItem('isAuthenticated', 'true');

        const ttlMillis = response.expiresIn ?? 86_400_000;
        localStorage.setItem(
          'sessionExpiresAt',
          String(Date.now() + ttlMillis),
        );

        this.currentUser.set(userSession);
      }),
    );
  }

  getCurrentTenantId(): string | null {
    const user =
      this.currentUser() ||
      JSON.parse(localStorage.getItem('user_profile') || 'null');
    return user?.tenantId || null;
  }

  isAuthenticated(): boolean {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const expiresAt = localStorage.getItem('sessionExpiresAt');

    if (!isAuth || !expiresAt) return false;

    if (Date.now() > parseInt(expiresAt, 10)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({
      next: () => console.log('✅ Logout backend OK'),
      error: () =>
        console.log('⚠️ Logout backend falhou (cookie já expirado?)'),
    });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('user_profile');
    this.currentUser.set(null);
  }

  getAuthorities(): string[] {
    const user =
      this.currentUser() ||
      JSON.parse(localStorage.getItem('user_profile') || 'null');
    return user?.roles ?? [];
  }
}
