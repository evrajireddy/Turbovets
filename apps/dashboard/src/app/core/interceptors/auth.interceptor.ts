/**
 * ============================================
 * AUTH INTERCEPTOR
 * ============================================
 * 
 * Intercepts all HTTP requests and:
 * 1. Adds Authorization header with JWT token
 * 2. Handles 401 errors (redirect to login)
 * 
 * REQUEST FLOW:
 * -------------
 *   Request → Interceptor → Add Token → API
 *      ↑                                  │
 *      └──────── Response ────────────────┘
 *                  │
 *            If 401 → Logout & Redirect
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'auth_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  // Clone request and add Authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: \`Bearer \${token}\`,
      },
    });
  }

  // Handle response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized, clear auth and redirect to login
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('current_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
