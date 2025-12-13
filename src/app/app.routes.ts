import { Routes } from '@angular/router';

export const routes: Routes = [
  // {
  //   path: '',
  //   loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  // },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/staff/profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/staff/history/history.page').then(m => m.HistoryPage)
  },
  {
    path: 'staff-list',
    loadComponent: () => import('./pages/admin/staff-list/staff-list.page').then(m => m.StaffListPage)
  },
  {
    path: 'my-shifts',
    loadComponent: () => import('./pages/staff/shift-assignments/shift-assignments.page').then(m => m.ShiftAssignmentsPage)
  },
  {
    path: 'shift-planner',
    loadComponent: () => import('./pages/admin/shift-planner/shift-planner.page').then(m => m.ShiftPlannerPage)
  },
  {
    path: 'admin/clocked',
    loadComponent: () => import('./pages/admin/clocked-records/clocked-records.page').then(m => m.ClockedRecordsPage)
  },
  {
    path: 'admin/shifts',
    loadComponent: () => import('./pages/admin/shift-records/shift-records.page').then(m => m.ShiftRecordsPage)
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/users/admin-users.page').then(m => m.AdminUsersPage)
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage)
  },
  {
    path: 'qr-generator',
    loadComponent: () => import('./pages/admin/qr-generator/qr-generator.page').then(m => m.QrGeneratorPage)
  },
  {
    path: 'qr-scanner',
    loadComponent: () => import('./pages/staff/qr-scanner/qr-scanner.page').then(m => m.QrScannerPage)
  },

];
