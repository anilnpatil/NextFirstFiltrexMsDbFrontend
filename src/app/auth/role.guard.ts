import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from './auth.service';

export const roleGuard = (role: UserRole): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const current = authService.getRole();

    // Admin-only pages (e.g. 'ADMIN' and register) require exact ADMIN role
    if (role === 'ADMIN') {
      return current === 'ADMIN';
    }

    // Pages that request 'USER' should be accessible by USER and ADMIN
    if (role === 'USER') {
      return current === 'USER' || current === 'ADMIN';
    }

    // Fallback: deny
    return false;
  };
};
