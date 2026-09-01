import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards';
import { AppLayout } from './core/layout/app-layout';
import { PublicLayout } from './core/layout/public-layout';
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'connexion' },
      ...[
        'login:connexion',
        'register:inscription',
        'forgot:mot-de-passe-oublie',
        'resend:renvoyer-verification',
        'reset:reinitialiser-mot-de-passe',
        'verify:verifier-email',
      ].map((x) => {
        const [mode, path] = x.split(':');
        return {
          path,
          data: { mode },
          loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
        };
      }),
      { path: 'verify-email', redirectTo: 'verifier-email' },
      { path: 'reset-password', redirectTo: 'reinitialiser-mot-de-passe' },
    ],
  },
  {
    path: 'app',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profil' },
      {
        path: 'dashboard',
        canActivate: [roleGuard(['ADMIN', 'HR', 'MANAGER'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/users/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'departements',
        canActivate: [roleGuard(['ADMIN', 'HR'])],
        loadComponent: () =>
          import('./features/departments/departments-page').then((m) => m.DepartmentsPage),
      },
      {
        path: 'employes',
        canActivate: [roleGuard(['ADMIN', 'HR', 'MANAGER'])],
        loadComponent: () =>
          import('./features/employees/employees-page').then((m) => m.EmployeesPage),
      },
      {
        path: 'conges',
        loadComponent: () =>
          import('./features/leave-requests/leaves-page').then((m) => m.LeavesPage),
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
  {
    path: '403',
    loadComponent: () => import('./features/errors/error-page').then((m) => m.ErrorPage),
    data: { code: '403' },
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/error-page').then((m) => m.ErrorPage),
    data: { code: '404' },
  },
];
