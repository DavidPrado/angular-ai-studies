import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const clonedReq = req.clone({
    withCredentials: true 
  });

 return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRoute = req.url.includes('/v1/auth/');
      if (error.status === 401 && !isAuthRoute) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
