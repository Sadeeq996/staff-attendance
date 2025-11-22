import { Injectable } from '@angular/core';
import { User, users } from '../models/user';
import { Hospital, hospitals } from '../models/hospital';
import { Attendance, attendance } from '../models/attendance';
import { Roster, roster } from '../models/roster';

@Injectable({ providedIn: 'root' })
export class MockDataService {
    private _users: User[] = [...users];
    private _hospitals: Hospital[] = [...hospitals];

    constructor() { }

    // Users
    getUsers(): User[] {
        return [...this._users];
    }

    findUserByEmail(email: string): User | undefined {
        return this._users.find(u => u.email === email);
    }

    // Hospitals
    getHospitals(): Hospital[] {
        return [...this._hospitals];
    }

    getHospitalById(id: number | string): Hospital | undefined {
        // models may use numeric or string ids; compare loosely.
        // Support numeric hospitalId like `101` matching `hosp-101`.
        const sid = String(id);
        return this._hospitals.find(h => String(h.id) === sid || String(h.id).endsWith(sid));
    }

    // Small helpers to allow services to seed or read mock arrays
    addUser(u: User) {
        this._users.push(u);
    }

    addHospital(h: Hospital) {
        this._hospitals.push(h);
    }

    deleteHospital(id: string) {
        this._hospitals = this._hospitals.filter(h => h.id !== id);
    }

    updateHospital(id: string, update: Partial<Hospital>) {
        const idx = this._hospitals.findIndex(h => h.id === id);
        if (idx === -1) return undefined;
        this._hospitals[idx] = { ...this._hospitals[idx], ...update, updated_at: new Date().toISOString() };
        return this._hospitals[idx];
    }

    // Attendance
    getAttendance(): Attendance[] {
        return [...attendance];
    }

    // Roster
    getRoster(): Roster[] {
        return [...roster];
    }
}
