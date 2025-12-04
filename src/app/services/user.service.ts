import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { User } from '../models/user';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';
import { GoogleSheetsService } from './google-sheets';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly KEY = 'mock_users_v1';

    constructor(
        private storage: StorageService,
        private mock: MockDataService,
        private gs: GoogleSheetsService
    ) {
        const existing = this.storage.get(this.KEY);
        if ((!existing || existing.length === 0) && environment.useMock) {
            const seed = this.mock.getUsers();
            this.storage.set(this.KEY, seed);
        }
    }

    private allLocal(): User[] {
        return this.storage.get(this.KEY) || [];
    }

    list$(): Observable<User[]> {
        if (!environment.useMock && environment.googleSheetsApiUrl) {
            return this.gs.list('users').pipe(catchError(() => of(this.allLocal())));
        }
        return of(this.allLocal());
    }

    // in user.service.ts
    getUsers$(hospitalId: string) {
        return this.list$().pipe(
            map(users => users.filter(u => u.hospitalId === hospitalId))
        );
    }


    getUserById$(id: number): Observable<User | undefined> {
        if (!environment.useMock && environment.googleSheetsApiUrl) {
            return this.gs.get('users', String(id)).pipe(catchError(() => of(this.allLocal().find(u => u.id === id))));
        }
        return of(this.allLocal().find(u => u.id === id));
    }

    create$(u: Omit<User, 'id'>): Observable<User> {
        if (!environment.useMock && environment.googleSheetsApiUrl) {
            const maxId = this.allLocal().reduce((m, x) => Math.max(m, x.id || 0), 0);
            const toCreate = { ...u, id: maxId + 1 };
            return this.gs.create('users', toCreate).pipe(map(res => res as User));
        }
        const arr = this.allLocal();
        const maxId = arr.reduce((m, x) => Math.max(m, x.id || 0), 0);
        const newUser: User = { ...u, id: maxId + 1 };
        arr.push(newUser);
        this.storage.set(this.KEY, arr);
        return of(newUser);
    }

    update$(id: number, update: Partial<User>): Observable<User | undefined> {
        if (!environment.useMock && environment.googleSheetsApiUrl) {
            const data = { ...update, id };
            return this.gs.update('users', data).pipe(catchError(() => of(undefined)));
        }
        const arr = this.allLocal();
        const idx = arr.findIndex(u => u.id === id);
        if (idx === -1) return of(undefined);
        arr[idx] = { ...arr[idx], ...update };
        this.storage.set(this.KEY, arr);
        return of(arr[idx]);
    }

    delete$(id: number): Observable<void> {
        if (!environment.useMock && environment.googleSheetsApiUrl) {
            return this.gs.delete('users', String(id)).pipe(map(() => void 0), catchError(() => of(void 0)));
        }
        const arr = this.allLocal().filter(u => u.id !== id);
        this.storage.set(this.KEY, arr);
        return of(void 0);
    }
}
