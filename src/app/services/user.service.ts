import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { MockDataService } from './mock-data.service';
import { User } from '../models/user';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { Observable, of, from, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly KEY = 'mock_users_v1';

    constructor(
        private storage: StorageService,
        private mock: MockDataService,
        private api: ApiService
    ) {
        const existing = this.storage.get(this.KEY);
        if ((!existing || existing.length === 0) && environment.useMock) {
            const seed = this.mock.getUsers();
            this.storage.set(this.KEY, seed);
        }
    }

    private all(): User[] {
        return this.storage.get(this.KEY) || [];
    }

    /**
     * Synchronous list kept for internal use; prefer `list$()` externally.
     */
    list(): User[] {
        return this.all();
    }

    /** Observable-based list */
    list$(): Observable<User[]> {
        if (!environment.useMock) {
            // TODO: implement ApiService.getUsers() and return that Observable
            return of([]);
        }
        return of(this.all());
    }

    /**
     * Async-friendly accessor used by pages that `await` users.
     * When `hospitalId` is provided, returns users for that hospital.
     */
    getUsers$(hospitalId?: string): Observable<User[]> {
        if (!environment.useMock) {
            // TODO: call ApiService.getUsers({hospitalId})
            return of([]);
        }
        const all = this.list();
        const res = hospitalId ? all.filter(u => u.hospitalId === hospitalId) : all;
        return of(res);
    }

    getUserById$(id: number): Observable<User | undefined> {
        if (!environment.useMock) {
            // TODO: call ApiService.getUser(id)
            return of(undefined);
        }
        return of(this.list().find(u => u.id === id));
    }

    create$(u: Omit<User, 'id'>): Observable<User> {
        if (!environment.useMock) {
            // TODO: call backend via ApiService.createUser(u)
            return of({ ...u, id: 0 } as User);
        }
        const arr = this.all();
        const maxId = arr.reduce((m, x) => Math.max(m, x.id || 0), 0);
        const newUser: User = { ...u, id: maxId + 1 } as User;
        // email uniqueness
        if (arr.some(x => x.email === newUser.email)) {
            throw new Error('Email already exists');
        }
        arr.push(newUser);
        this.storage.set(this.KEY, arr);
        return of(newUser);
    }

    update$(id: number, update: Partial<User>): Observable<User | undefined> {
        if (!environment.useMock) {
            // TODO: call backend via ApiService.updateUser(id, update)
            return of(undefined);
        }
        const arr = this.all();
        const idx = arr.findIndex(u => u.id === id);
        if (idx === -1) return of(undefined);
        // email uniqueness
        if (update.email && arr.some(x => x.email === update.email && x.id !== id)) {
            throw new Error('Email already exists');
        }
        arr[idx] = { ...arr[idx], ...update };
        this.storage.set(this.KEY, arr);
        return of(arr[idx]);
    }

    delete$(id: number): Observable<void> {
        if (!environment.useMock) {
            // TODO: call backend via ApiService.deleteUser(id)
            return of(void 0);
        }
        const arr = this.all().filter(u => u.id !== id);
        this.storage.set(this.KEY, arr);
        return of(void 0);
    }

    bulkImport$(users: Omit<User, 'id'>[]): Observable<{ created: User[]; errors: string[] }> {
        const task = async () => {
            const created: User[] = [];
            const errors: string[] = [];
            for (const u of users) {
                try {
                    const c = await firstValueFrom(this.create$(u as any));
                    created.push(c);
                } catch (e: any) {
                    errors.push(`${u.email}: ${e.message || e}`);
                }
            }
            return { created, errors };
        };
        return from(task());
    }
}

