import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '../models/user';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import { MockDataService } from './mock-data.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userSubject = new BehaviorSubject<User | null>(this.currentUser());

  private mockUsers: User[] = [];

  constructor(
    private storage: StorageService,
    private router: Router,
    private http: HttpClient,
    private mockData: MockDataService
  ) {
    // initialize mock users from the central mock data service
    this.mockUsers = this.mockData.getUsers();

    const storedUser = this.storage.get(this.KEY);
    this.userSubject = new BehaviorSubject<User | null>(storedUser || null);
  }

  private readonly KEY = 'mock_auth_user';



  login(email: string, password: string): Promise<User> {
    if (!environment.useMock) {
      // TODO: replace with real backend call when available
      // Example implementation once backend exists:
      // return firstValueFrom(this.http.post<User>('/api/auth/login', { email, password }));
      return Promise.reject('Backend auth not implemented yet');
    }

    // mock auth: accept any password
    const user = this.mockUsers.find(u => u.email === email);
    if (!user) return Promise.reject('Invalid credentials');
    this.storage.set(this.KEY, user);
    this.userSubject.next(user);
    return Promise.resolve(user);
  }

  // Observable version
  login$(email: string, password: string): Observable<User> {
    if (!environment.useMock) {
      // TODO: call backend via HttpClient and return observable
      return of(undefined as unknown as User);
    }
    const user = this.mockUsers.find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    this.storage.set(this.KEY, user);
    this.userSubject.next(user);
    return of(user);
  }

  logout() {
    this.storage.remove(this.KEY);
    // this.storage.clear();
    this.userSubject.next(null); // <-- emit logout
    this.router.navigateByUrl('/login');
  }

  logout$(): Observable<void> {
    this.logout();
    return of(void 0);
  }

  currentUser(): User | null {
    return this.storage.get(this.KEY);
  }

  currentUser$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  isLoggedIn$(): Observable<boolean> {
    return of(this.isLoggedIn());
  }
}
