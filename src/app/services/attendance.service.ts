import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { Attendance } from '../models/attendance';
import { MockDataService } from './mock-data.service';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';
// If/when backend is available you can import HttpClient and call endpoints:
// import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private readonly KEY = 'mock_attendance_v1';

  constructor(private storage: StorageService, private mockData: MockDataService) {
    const existing = this.storage.get(this.KEY);

    // If no attendance stored yet and we're using mock data, seed with central mock data
    if ((!existing || existing.length === 0) && environment.useMock) {
      const seed = this.mockData.getAttendance();
      this.storage.set(this.KEY, seed);
    }
  }

  private all(): Attendance[] {
    return this.storage.get(this.KEY) || [];
  }

  /** Public accessor for all attendance records (used by admin pages) */
  getAllRecords$(): Observable<Attendance[]> {
    return of(this.all());
  }

  save$(record: Attendance): Observable<Attendance> {
    if (!environment.useMock) {
      // TODO: implement backend persistence here using HttpClient
      // e.g. return firstValueFrom(this.http.post<Attendance>('/api/attendance', record));
    }
    const arr = this.all();
    arr.push(record);
    this.storage.set(this.KEY, arr);
    return of(record);
  }

  clockIn$(userId: number, hospitalId: number | undefined, shift: 'morning' | 'night'): Observable<Attendance> {
    if (!environment.useMock) {
      // TODO: call backend clock-in endpoint and return the created record
      // e.g. return firstValueFrom(this.http.post<Attendance>(`/api/attendance/clockin`, { userId, hospitalId, shift }));
    }
    const today = this.getTodayStr();
    const exists = this.all().some(r =>
      r.userId === userId &&
      r.shift === shift &&
      r.status === 'IN' &&
      r.timestamp.startsWith(today)
    );
    if (exists) throw new Error('Already clocked in for this shift today');

    const rec: Attendance = {
      id: uuidv4(),
      userId,
      hospitalId,
      shift,
      status: 'IN',
      timestamp: new Date().toISOString()
    };
    this.save$(rec);
    return of(rec);
  }

  clockOut$(userId: number, hospitalId: number | undefined, shift: 'morning' | 'night'): Observable<Attendance> {
    if (!environment.useMock) {
      // TODO: call backend clock-out endpoint and return the created record
      // e.g. return firstValueFrom(this.http.post<Attendance>(`/api/attendance/clockout`, { userId, hospitalId, shift }));
    }
    const today = this.getTodayStr();
    const arr = this.all();

    const inRec = arr.find(r =>
      r.userId === userId &&
      r.shift === shift &&
      r.status === 'IN' &&
      r.timestamp.startsWith(today)
    );
    if (!inRec) throw new Error('No IN record found for this shift today');

    const outExists = arr.some(r =>
      r.userId === userId &&
      r.shift === shift &&
      r.status === 'OUT' &&
      r.timestamp.startsWith(today)
    );
    if (outExists) throw new Error('Already clocked out for this shift today');

    const clockOutTime = new Date();
    const clockInTime = new Date(inRec.timestamp);
    const durationMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 1000 / 60);

    const rec: Attendance = {
      id: uuidv4(),
      userId,
      hospitalId,
      shift,
      status: 'OUT',
      timestamp: clockOutTime.toISOString(),
      durationMinutes
    };
    this.save$(rec);
    return of(rec);
  }

  getHistoryForUser$(userId: number): Observable<Attendance[]> {
    const res = this.all()
      .filter(r => r.userId === userId)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    return of(res);
  }

  private getTodayStr(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  update$(recordId: string, updateData: Partial<Omit<Attendance, 'id'>>): Observable<Attendance | undefined> {
    const arr = this.all();
    const index = arr.findIndex(r => r.id === recordId);
    if (index === -1) return of(undefined);

    arr[index] = { ...arr[index], ...updateData };
    this.storage.set(this.KEY, arr);
    return of(arr[index]);
  }

}
