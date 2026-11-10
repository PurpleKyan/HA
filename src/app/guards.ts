import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

/** Usage: canActivate: [roleGuard('admin')] */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }
    if (roles.length && !roles.includes(auth.role() as Role)) {
      return router.createUrlTree([auth.homeFor(auth.role())]);
    }
    return true;
  };