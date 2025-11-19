import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '../models/user';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private storage: StorageService, private router: Router) { }

  private readonly KEY = 'mock_auth_user';

  // mock users
  private mockUsers: User[] = [
    { id: 1, email: 'alice@example.com', fullName: 'Alice Nurse', role: 'staff', hospitalId: 1 },
    { id: 2, email: 'bob@example.com', fullName: 'Bob Admin', role: 'hospital_admin', hospitalId: 1 }
  ];


  login(email: string, password: string): Promise<User> {
    // fake auth: accept any password
    const user = this.mockUsers.find(u => u.email === email);
    if (!user) return Promise.reject('Invalid credentials');
    this.storage.set(this.KEY, user);
    return Promise.resolve(user);
  }

  logout() {
    this.storage.remove(this.KEY);
    this.router.navigateByUrl('/login');
  }

  currentUser(): User | null {
    return this.storage.get(this.KEY);
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}
