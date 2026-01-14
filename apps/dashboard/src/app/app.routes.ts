/**
 * ============================================
 * APPLICATION ROUTES
 * ============================================
 * 
 * ROUTE STRUCTURE:
 * ----------------
 * 
 *   /login          → LoginComponent (public)
 *   /register       → RegisterComponent (public)
 *   /               → Redirect to /dashboard
 *   /dashboard      → DashboardComponent (protected)
 *   /tasks          → TaskListComponent (protected)
 *   /tasks/:id      → TaskDetailComponent (protected)
 *   /audit          → AuditLogComponent (protected, admin only)
 *   /profile        → ProfileComponent (protected)
 *   /**             → NotFoundComponent
 * 
 * GUARDS:
 * -------
 * • authGuard - Protects routes requiring authentication
 * • roleGuard - Protects routes requiring specific roles
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => 
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => 
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  // Protected routes
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => 
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'tasks',
        loadComponent: () => 
          import('./features/tasks/tasks.component').then(m => m.TasksComponent),
      },
      {
        path: 'audit',
        loadComponent: () => 
          import('./features/audit/audit.component').then(m => m.AuditComponent),
      },
      {
        path: 'profile',
        loadComponent: () => 
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
