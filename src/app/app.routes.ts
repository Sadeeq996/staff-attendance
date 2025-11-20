import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/staff/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/staff/history/history.page').then( m => m.HistoryPage)
  },
  {
    path: 'staff-list',
    loadComponent: () => import('./pages/staff/staff-list/staff-list.page').then( m => m.StaffListPage)
  },
  {
    path: 'shift-planner',
    loadComponent: () => import('./pages/admin/shift-planner/shift-planner.page').then( m => m.ShiftPlannerPage)
  },
];
