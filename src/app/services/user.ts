import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { users } from '../models/user';
import { Observable, of } from 'rxjs';

// export interface User {
//   id: number;
//   fullName: string;
//   role: 'staff' | 'admin';
//   hospitalId: number;
//   shiftToday?: string;
//   status?: 'clocked-in' | 'clocked-out';
// }



@Injectable({
  providedIn: 'root',
})
export class UserService {
  private LS_KEY = 'app_users';
  private users = [...users];

  constructor() {
    this.seedIfEmpty();
  }

  private seedIfEmpty() {
    const data = localStorage.getItem(this.LS_KEY);
    if (!data) {
      const users = this.users;
      // const mock: User[] = [
      //   { id: 1, fullName: 'Alice Nurse', role: 'staff', hospitalId: 1 },
      //   { id: 2, fullName: 'John Doe', role: 'staff', hospitalId: 1 },
      //   { id: 3, fullName: 'Dr. Admin', role: 'admin', hospitalId: 1 }
      // ];
      localStorage.setItem(this.LS_KEY, JSON.stringify(users));
    }
  }

  private load(): User[] {
    return JSON.parse(localStorage.getItem(this.LS_KEY) || '[]');
  }

  private save(users: User[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(users));
  }

  getAll(hospitalId: number): User[] {
    return this.load().filter(u => u.hospitalId === hospitalId);
  }

  getAllUsers(): Observable<User[]> {
    return of(this.users);
  }


  getById(id: number): User | undefined {
    return this.load().find(u => u.id === id);
  }

  getUserById(id: number): Observable<User | undefined> {
    return of(this.users.find(u => u.id === id));
  }

  create(user: Omit<User, 'id'>): User {
    const users = this.load();
    const newUser: User = {
      id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
      ...user
    };
    users.push(newUser);
    this.save(users);
    return newUser;
  }

  createUser(user: Omit<User, 'id'>): Observable<User> {
    const newUser: User = { ...user, id: this.users.length + 1 };
    this.users.push(newUser);
    return of(newUser);
  }

  update(id: number, patch: Partial<User>): User | undefined {
    const users = this.load();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    users[index] = { ...users[index], ...patch };
    this.save(users);
    return users[index];
  }

  updateUser(id: number, updateData: Partial<Omit<User, 'id'>>): Observable<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return of(undefined);
    this.users[index] = { ...this.users[index], ...updateData };
    return of(this.users[index]);
  }


  delete(id: number) {
    const users = this.load().filter(u => u.id !== id);
    this.save(users);
  }

  deleteUser(id: number): Observable<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    return of(this.users.length < initialLength);
  }
}
