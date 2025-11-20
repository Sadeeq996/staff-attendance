import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Attendance } from '../models/attendance';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private readonly KEY = 'mock_attendance_v1';

  constructor(private storage: StorageService) {
    if (!this.storage.get(this.KEY)) this.storage.set(this.KEY, []);
  }

  private all(): Attendance[] {
    return this.storage.get(this.KEY) || [];
  }

  save(record: Attendance) {
    const arr = this.all();
    arr.push(record);
    this.storage.set(this.KEY, arr);
  }

  clockIn(userId: number, hospitalId: number | undefined, shift: 'morning' | 'night') {
    const today = this.getTodayStr();
    const exists = this.all().some(r => r.userId === userId && r.shift === shift && r.status === 'IN' && r.timestamp.startsWith(today));
    if (exists) throw new Error('Already clocked in for this shift today');

    const rec: Attendance = {
      id: uuidv4(),
      userId,
      hospitalId,
      shift,
      status: 'IN',
      timestamp: new Date().toISOString()
    };
    this.save(rec);
    return rec;
  }

  clockOut(userId: number, hospitalId: number | undefined, shift: 'morning' | 'night') {
    const today = this.getTodayStr();
    const arr = this.all();
    const inRec = arr.find(r => r.userId === userId && r.shift === shift && r.status === 'IN' && r.timestamp.startsWith(today));
    if (!inRec) throw new Error('No IN record found for this shift today');

    const outExists = arr.some(r => r.userId === userId && r.shift === shift && r.status === 'OUT' && r.timestamp.startsWith(today));
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
    this.save(rec);
    return rec;
  }

  getHistoryForUser(userId: number) {
    return this.all()
      .filter(r => r.userId === userId)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }

  /** helper to get local YYYY-MM-DD for roster matching */
  private getTodayStr(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
