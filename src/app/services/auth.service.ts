import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';
import { of, Observable, firstValueFrom, map, BehaviorSubject } from 'rxjs';
import { GoogleSheetsService } from './google-sheets';
import { ShiftAssignment } from '../models/shift-assignment';
import { ShiftPlannerService } from './shift-planner-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // private readonly KEY = 'mock_auth_user';
  private readonly KEY = 'auth_user';
  private mockUsers: User[] = [];
  private _currentUser$ = new BehaviorSubject<User | null>(null);
  private _currentShift$ = new BehaviorSubject<ShiftAssignment | null>(null);


  constructor(
    private storage: StorageService,
    private router: Router,
    private mockData: MockDataService,
    private gs: GoogleSheetsService,
    private shiftPlanner: ShiftPlannerService,
  ) {
    this.mockUsers = this.mockData.getUsers();
    const stored = this.storage.get(this.KEY);
    if (stored) this._currentUser$.next(stored);
  }

  // login(email: string, password?: string): Promise<User> {
  //   if (!environment.useMock) return Promise.reject('Backend auth not implemented');
  //   const user = this.mockUsers.find(u => u.email === email);
  //   if (!user) return Promise.reject('Invalid credentials');
  //   this.storage.set(this.KEY, user);
  //   return Promise.resolve(user);
  // }

  // login$(email: string, password?: string): Observable<User> {
  //   if (!environment.useMock) return of(undefined as any);
  //   const user = this.mockUsers.find(u => u.email === email);
  //   if (!user) throw new Error('Invalid credentials');
  //   this.storage.set(this.KEY, user);
  //   return of(user);
  // }

  // async login(email: string, password?: string): Promise<User> {
  //   // If you want to allow local mock for testing
  //   if (environment.useMock) {
  //     const user = this.mockUsers.find(u => u.email === email);
  //     if (!user) throw new Error('Invalid credentials');
  //     this.storage.set(this.KEY, user);
  //     return user;
  //   }

  //   // Production: fetch users from Google Sheets
  //   try {
  //     // list all users from Google Sheets
  //     const users = await firstValueFrom(this.gs.list('users')) as User[];

  //     // match user by email (and password if stored in sheet)
  //     // const matched = users.find(u => u.email === email && u.password === password);
  //     const matched = users.find(u => u.email === email);
  //     if (!matched) throw new Error('Invalid credentials');

  //     this.storage.set(this.KEY, matched);
  //     return matched;
  //   } catch (err) {
  //     console.error('Google Sheets auth error', err);
  //     throw new Error('Login failed');
  //   }
  // }

  // this method fails to retrieve user data properly from Google Sheets
  // async login(email: string, password: string): Promise<User> {
  //   let user: User | undefined;

  //   if (environment.useMock) {
  //     // Mock data logic (optional)
  //     const users = await firstValueFrom(this.gs.list('users')) as User[];
  //     const user = users.find(u => u.email === email);

  //     if (!user) throw new Error('Invalid credentials');
  //   } else {
  //     // Live API login via Google Sheets
  //     // const payload = { resource: 'users', action: 'login', data: { email, password }, apiKey: environment.googleSheetsApiKey };
  //     const payload = { resource: 'users', action: 'login', data: { email }, apiKey: environment.googleSheetsApiKey };
  //     const result: any = await firstValueFrom(this.gs.create('users', payload));
  //     if (!result?.success || !result.user) throw new Error('Invalid credentials');
  //     user = result.user;
  //   }

  //   // Save user in storage & BehaviorSubject
  //   this.storage.set(this.KEY, user);
  //   this._currentUser$.next(user!);

  //   // Fetch current shift assignment for today
  //   const today = new Date().toISOString().split('T')[0];
  //   const shift = await this.shiftPlanner.getAssignmentFor(user!.id, user!.hospitalId!, today);
  //   this._currentShift$.next(shift);

  //   return user!;
  // }
  // auth.service.ts (replace existing login)


  async login(email: string, password?: string): Promise<User> {
    // if you still want local mock mode, optionally use environment.useMock
    // but here we fetch the users list from Google Sheets and match locally
    try {
      const users = await firstValueFrom(this.gs.list('users')) as any[]; // list uses GET
      if (!Array.isArray(users) || users.length === 0) {
        throw new Error('No users found');
      }

      // find user by email (and password if you store it in sheet)
      const matched = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
      if (!matched) throw new Error('Invalid credentials');

      // optionally verify password if stored in sheet:
      // if (password && matched.password !== password) throw new Error('Invalid credentials');

      // save and set subjects
      this.storage.set(this.KEY, matched);
      this._currentUser$.next(matched);

      // fetch today's shift (await the async shift planner)
      // const today = new Date().toISOString().split('T')[0];
      const today = this.getLocalDateStr();
      try {
        const shift = await this.shiftPlanner.getAssignmentFor(Number(matched.id), String(matched.hospitalId), today);
        this._currentShift$.next(shift);
      } catch (e) {
        this._currentShift$.next(null);
        console.warn('Failed to fetch shift after login', e);
      }

      return matched as User;
    } catch (err: any) {
      console.error('Login failed', err);
      throw new Error(err?.message || 'Login failed');
    }
  }


  //observable version
  login$(email: string, password?: string): Observable<User> {
    return this.gs.list('users').pipe(
      map(users => {
        const matched = (users as User[]).find(u => u.email === email);
        if (!matched) throw new Error('Invalid credentials');
        this.storage.set(this.KEY, matched);
        return matched;
      })
    );
  }

  logout() {
    this.storage.remove(this.KEY);
    this.storage.clear();
    this._currentUser$.next(null);
    this._currentShift$.next(null);
    this.router.navigateByUrl('/login');
  }

  // currentUser(): User | null {
  //   return this.storage.get(this.KEY);
  // }
  /** Get current user */
  currentUser(): User | null {
    return this._currentUser$.value;
  }

  // currentUser$(): Observable<User | null> {
  //   return of(this.currentUser());
  // }

  /** Observable of current user */
  currentUser$() {
    return this._currentUser$.asObservable();
  }

  /** Get current user's shift */
  currentShift(): ShiftAssignment | null {
    return this._currentShift$.value;
  }

  /** Observable of current user's shift */
  currentShift$() {
    return this._currentShift$.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  isLoggedIn$(): Observable<boolean> {
    return of(this.isLoggedIn());
  }


  getLocalDateStr(date: Date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

}
