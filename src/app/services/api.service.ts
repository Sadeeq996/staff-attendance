import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { Hospital } from '../models/hospital';
import { Attendance } from '../models/attendance';
import { Roster } from '../models/roster';
import { ShiftAssignment } from '../models/shift-assignment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base = environment.apiBaseUrl || '';

    constructor(private http: HttpClient) { }

    // --- Auth ---
    login(email: string, password: string): Observable<User> {
        return this.http.post<User>(`${this.base}/auth/login`, { email, password });
    }

    // --- Hospitals ---
    getHospitals(): Observable<Hospital[]> {
        return this.http.get<Hospital[]>(`${this.base}/hospitals`);
    }

    getHospital(id: string): Observable<Hospital> {
        return this.http.get<Hospital>(`${this.base}/hospitals/${id}`);
    }

    createHospital(payload: Partial<Hospital>): Observable<Hospital> {
        return this.http.post<Hospital>(`${this.base}/hospitals`, payload);
    }

    updateHospital(id: string, payload: Partial<Hospital>): Observable<Hospital> {
        return this.http.patch<Hospital>(`${this.base}/hospitals/${id}`, payload);
    }

    deleteHospital(id: string): Observable<boolean> {
        return this.http.delete<boolean>(`${this.base}/hospitals/${id}`);
    }

    // --- Attendance ---
    getAttendance(query?: { userId?: number; hospitalId?: number; date?: string }): Observable<Attendance[]> {
        let params = new HttpParams();
        if (query?.userId) params = params.set('userId', String(query.userId));
        if (query?.hospitalId) params = params.set('hospitalId', String(query.hospitalId));
        if (query?.date) params = params.set('date', query.date);
        return this.http.get<Attendance[]>(`${this.base}/attendance`, { params });
    }

    postAttendance(record: Attendance): Observable<Attendance> {
        return this.http.post<Attendance>(`${this.base}/attendance`, record);
    }

    clockIn(payload: { userId: number; hospitalId?: number; shift: 'morning' | 'night' }): Observable<Attendance> {
        return this.http.post<Attendance>(`${this.base}/attendance/clockin`, payload);
    }

    clockOut(payload: { userId: number; hospitalId?: number; shift: 'morning' | 'night' }): Observable<Attendance> {
        return this.http.post<Attendance>(`${this.base}/attendance/clockout`, payload);
    }

    // --- Roster ---
    getRoster(hospitalId: number, year: number, month: number): Observable<Roster[]> {
        const params = new HttpParams().set('year', String(year)).set('month', String(month));
        return this.http.get<Roster[]>(`${this.base}/roster/${hospitalId}`, { params });
    }

    saveRoster(hospitalId: number, year: number, month: number, roster: Roster[]): Observable<any> {
        return this.http.post(`${this.base}/roster/${hospitalId}`, { year, month, roster });
    }

    // --- Shift assignments ---
    getAssignments(hospitalId: number, year: number, month: number): Observable<ShiftAssignment[]> {
        const params = new HttpParams().set('year', String(year)).set('month', String(month));
        return this.http.get<ShiftAssignment[]>(`${this.base}/assignments/${hospitalId}`, { params });
    }

    saveAssignment(assign: Partial<ShiftAssignment>): Observable<ShiftAssignment> {
        return this.http.post<ShiftAssignment>(`${this.base}/assignments`, assign);
    }

    deleteAssignment(id: string): Observable<boolean> {
        return this.http.delete<boolean>(`${this.base}/assignments/${id}`);
    }
}
