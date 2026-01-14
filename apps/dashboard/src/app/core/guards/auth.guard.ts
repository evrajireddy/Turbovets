/**
 * ============================================
 * AUTH GUARD
 * ============================================
 * 
 * Protects routes requiring authentication.
 * Redirects to login if not authenticated.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

const TOKEN_KEY = 'auth_token';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    return true;
  }

  // Store attempted URL for redirecting after login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
