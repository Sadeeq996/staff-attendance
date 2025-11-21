import { Injectable } from '@angular/core';


export interface User {
  id: number;
  fullName: string;
  role: 'staff' | 'admin';
  hospitalId: number;
  shiftToday?: string;
  status?: 'clocked-in' | 'clocked-out';
}



@Injectable({
  providedIn: 'root',
})
export class UserService {
  private LS_KEY = 'app_users';

  constructor() {
    this.seedIfEmpty();
  }

  private seedIfEmpty() {
    const data = localStorage.getItem(this.LS_KEY);
    if (!data) {
      const mock: User[] = [
        { id: 1, fullName: 'Alice Nurse', role: 'staff', hospitalId: 1 },
        { id: 2, fullName: 'John Doe', role: 'staff', hospitalId: 1 },
        { id: 3, fullName: 'Dr. Admin', role: 'admin', hospitalId: 1 }
      ];
      localStorage.setItem(this.LS_KEY, JSON.stringify(mock));
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

  getById(id: number): User | undefined {
    return this.load().find(u => u.id === id);
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

  update(id: number, patch: Partial<User>): User | undefined {
    const users = this.load();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    users[index] = { ...users[index], ...patch };
    this.save(users);
    return users[index];
  }

  delete(id: number) {
    const users = this.load().filter(u => u.id !== id);
    this.save(users);
  }
}
