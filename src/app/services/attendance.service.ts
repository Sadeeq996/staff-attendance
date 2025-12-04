import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { Attendance } from '../models/attendance';
import { MockDataService } from './mock-data.service';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';
import { GoogleSheetsService } from './google-sheets';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly KEY = 'mock_attendance_v1';

  constructor(
    private storage: StorageService,
    private mockData: MockDataService,
    private gs: GoogleSheetsService
  ) {
    const existing = this.storage.get(this.KEY);
    if ((!existing || existing.length === 0) && environment.useMock) {
      const seed = this.mockData.getAttendance();
      this.storage.set(this.KEY, seed);
    }
  }

  private allLocal(): Attendance[] {
    return this.storage.get(this.KEY) || [].map(this.addDateLocal);;
  }

  getAllRecords$(): Observable<Attendance[]> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.list('attendance').pipe(
        catchError(() => of(this.allLocal()))
      ) as Observable<Attendance[]>;
    }
    return of(this.allLocal());
  }

  save$(record: any): Observable<any> {
    // ensure record has id and dateLocal
    if (!record.id) record.id = uuidv4();
    if (!record.dateLocal) record.dateLocal = this.localDateString(new Date(record.timestamp || Date.now()));

    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.create('attendance', record).pipe(
        map(res => {
          if (res) {
            const arr = this.allLocal();
            arr.push(res);
            this.storage.set(this.KEY, arr);
            return res;
          }
          // fallback if API didn't return created object
          const arr = this.allLocal();
          arr.push(record);
          this.storage.set(this.KEY, arr);
          return record;
        }),
        catchError(() => {
          const arr = this.allLocal();
          arr.push(record);
          this.storage.set(this.KEY, arr);
          return of(record);
        })
      );
    } else {
      const arr = this.allLocal();
      arr.push(record);
      this.storage.set(this.KEY, arr);
      return of(record);
    }
  }

  // ---------------- helpers for local dates ----------------
  private localDateString(d: Date): string {
    // produce YYYY-MM-DD using the local timezone of the runtime (e.g., WAT)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getRecordDateLocal(r: any): string {
    // prefer explicit dateLocal if present (from older saves it may be missing)
    if (r.dateLocal) return String(r.dateLocal);
    // derive from timestamp (timestamp may be ISO string in UTC)
    try {
      const dt = new Date(r.timestamp);
      return this.localDateString(dt);
    } catch (e) {
      return this.localDateString(new Date());
    }
  }

  private getTodayStr(): string {
    const now = new Date();
    return this.localDateString(now);
  }

  // ---------------- clock in/out ----------------

  clockIn$(userId: number, hospitalId: number | undefined, shift: 'morning' | 'night'): Observable<Attendance> {
    const today = new Date().toLocaleDateString('en-CA');

    // check both records stored with dateLocal and timestamp-derived date
    const exists = this.allLocal().some(r =>
      r.userId === userId &&
      r.shift === shift &&
      r.status === 'IN' &&
      this.getRecordDateLocal(r) === today
    );
    if (exists) throw new Error('Already clocked in for this shift today');

    const now = new Date();
    const rec: any = {
      id: uuidv4(),
      userId,
      hospitalId,
      shift,
      status: 'IN',
      timestamp: now.toISOString(),     // keep canonical ISO timestamp (UTC)
      dateLocal: this.localDateString(now) // store local date for comparison
    };

    // return the save observable so caller can await persistence
    return this.save$(rec) as Observable<Attendance>;
  }

  clockOut$(userId: number, hospitalId: number | undefined, shift: 'morning' | 'night'): Observable<Attendance> {
    const today = new Date().toLocaleDateString('en-CA');
    const arr = this.allLocal();

    const inRec = arr.find(r =>
      r.userId === userId &&
      r.shift === shift &&
      r.status === 'IN' &&
      this.getRecordDateLocal(r) === today
    );
    if (!inRec) throw new Error('No IN record found for this shift today');

    const outExists = arr.some(r =>
      r.userId === userId &&
      r.shift === shift &&
      r.status === 'OUT' &&
      this.getRecordDateLocal(r) === today
    );
    if (outExists) throw new Error('Already clocked out for this shift today');

    const clockOutTime = new Date();
    const clockInTime = new Date(inRec.timestamp);
    const durationMinutes = Math.max(0, Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 1000 / 60));

    const rec: any = {
      id: uuidv4(),
      userId,
      hospitalId,
      shift,
      status: 'OUT',
      timestamp: clockOutTime.toISOString(),
      dateLocal: this.localDateString(clockOutTime),
      durationMinutes
    };

    return this.save$(rec) as Observable<Attendance>;
  }

  getHistoryForUser$(userId: number): Observable<Attendance[]> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.list('attendance').pipe(
        map((rows: Attendance[]) =>
          rows
            .map(r => {
              // ensure dateLocal exists in rows we received
              const rr: any = Object.assign({}, r);
              if (!rr.dateLocal) rr.dateLocal = this.getRecordDateLocal(rr);
              return rr;
            })
            .filter(r => Number(r.userId) === Number(userId))
            .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
        ),
        catchError(() => of(this.allLocal().filter(r => r.userId === userId)))
      );
    }
    const res = this.allLocal()
      .map(r => {
        // ensure dateLocal exists on local copies too
        const rr: any = Object.assign({}, r);
        if (!rr.dateLocal) rr.dateLocal = this.getRecordDateLocal(rr);
        return rr;
      })
      .filter(r => r.userId === userId)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    return of(res);
  }

  update$(recordId: string, updateData: Partial<Attendance>) {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      const data = Object.assign({}, updateData, { id: recordId });
      // ensure dateLocal if timestamp included
      if ((data as any).timestamp && !(data as any).dateLocal) {
        (data as any).dateLocal = this.getRecordDateLocal(data as any);
      }
      return this.gs.update('attendance', data).pipe(
        map((updated: any) => {
          const arr = this.allLocal();
          const idx = arr.findIndex(x => x.id === recordId);
          if (idx >= 0) {
            arr[idx] = updated;
            this.storage.set(this.KEY, arr);
          }
          return updated;
        }),
        catchError(() => {
          const arr = this.allLocal();
          const idx = arr.findIndex(x => x.id === recordId);
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], ...updateData };
            this.storage.set(this.KEY, arr);
            return of(arr[idx]);
          }
          return of(undefined);
        })
      );
    } else {
      const arr = this.allLocal();
      const index = arr.findIndex(r => r.id === recordId);
      if (index === -1) return of(undefined);
      arr[index] = { ...arr[index], ...updateData };
      // ensure dateLocal if timestamp changed
      if ((updateData as any).timestamp) arr[index].dateLocal = this.getRecordDateLocal(arr[index]);
      this.storage.set(this.KEY, arr);
      return of(arr[index]);
    }
  }

  private addDateLocal(record: Attendance): Attendance {
    const dt = new Date(record.timestamp);
    record.dateLocal = dt.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    return record;
  }



}
