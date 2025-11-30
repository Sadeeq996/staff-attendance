import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { ShiftAssignment, ShiftType } from '../models/shift-assignment';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';
// If you add backend endpoints later, inject HttpClient and implement calls where marked.

@Injectable({
  providedIn: 'root'
})
export class ShiftPlannerService {
  // storage key stores an array of ShiftAssignment objects
  private readonly KEY = 'shift_planner_v1';

  constructor(private storage: StorageService, private mockData: MockDataService) {
    const existing = this.storage.get(this.KEY);
    if (!existing || existing.length === 0) {
      // seed assignments from mock roster when using mock data
      if (environment.useMock) {
        const mockRoster = this.mockData.getRoster();
        const assignments: ShiftAssignment[] = mockRoster.map(r => ({
          id: r.id || uuidv4(),
          userId: r.userId,
          hospitalId: r.hospitalId,
          date: r.date,
          shift: r.shift as ShiftType,
          manuallyAssigned: !!r.manuallyAssigned
        }));
        this.storage.set(this.KEY, assignments);
      } else {
        this.storage.set(this.KEY, []);
      }
    }
  }

  private all(): ShiftAssignment[] {
    return (this.storage.get(this.KEY) as ShiftAssignment[]) || [];
  }

  private saveAll(items: ShiftAssignment[]) {
    this.storage.set(this.KEY, items);
  }

  /** Helper: local YYYY-MM-DD */
  private formatDate(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /** Get assignments for a hospital and month (month: 1..12) */
  getMonthAssignments(hospitalId: string, year: number, month: number): ShiftAssignment[] {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.all().filter(a => a.hospitalId === hospitalId && a.date.startsWith(prefix));
  }

  /** Observable counterpart */
  getMonthAssignments$(hospitalId: string, year: number, month: number): Observable<ShiftAssignment[]> {
    return of(this.getMonthAssignments(hospitalId, year, month));
  }

  /** Get assignment for a single user/date */
  getAssignmentFor(userId: number, hospitalId: string, date: string): ShiftAssignment | null {
    return this.all().find(a => a.userId === userId && a.hospitalId === hospitalId && a.date === date) || null;
  }

  getAssignmentFor$(userId: number, hospitalId: string, date: string): Observable<ShiftAssignment | null> {
    return of(this.getAssignmentFor(userId, hospitalId, date));
  }

  /** Save or update a single assignment */
  saveAssignment(assign: { userId: number; hospitalId: string; date: string; shift: ShiftType; manuallyAssigned?: boolean }) {
    if (!environment.useMock) {
      // TODO: call backend to save single assignment
      // e.g. this.http.post(`/api/assignments`, assign)
    }
    const arr = this.all();
    const idx = arr.findIndex(a => a.userId === assign.userId && a.hospitalId === assign.hospitalId && a.date === assign.date);

    if (idx >= 0) {
      // update
      arr[idx].shift = assign.shift;
      arr[idx].manuallyAssigned = !!assign.manuallyAssigned || true;
    } else {
      // new
      arr.push({
        id: uuidv4(),
        userId: assign.userId,
        hospitalId: assign.hospitalId,
        date: assign.date,
        shift: assign.shift,
        manuallyAssigned: !!assign.manuallyAssigned
      });
    }
    this.saveAll(arr);
  }

  saveAssignment$(assign: { userId: number; hospitalId: string; date: string; shift: ShiftType; manuallyAssigned?: boolean }): Observable<void> {
    this.saveAssignment(assign);
    return of(void 0);
  }

  /** Remove assignment (set to no record) */
  removeAssignment(userId: number, hospitalId: string, date: string) {
    if (!environment.useMock) {
      // TODO: call backend to remove assignment
      // e.g. this.http.delete(`/api/assignments/${id}`)
    }
    const arr = this.all().filter(a => !(a.userId === userId && a.hospitalId === hospitalId && a.date === date));
    this.saveAll(arr);
  }

  removeAssignment$(userId: number, hospitalId: string, date: string): Observable<void> {
    this.removeAssignment(userId, hospitalId, date);
    return of(void 0);
  }

  /**
   * Auto-generate a default monthly plan for given users if none exists yet.
   * - month: 1..12
   * - rule: sample alternating pattern, can be replaced by admin later
   * Returns the created assignments.
   */
  generateDefaultMonthIfEmpty(hospitalId: string, userIds: number[], year: number, month: number): ShiftAssignment[] {
    const existing = this.getMonthAssignments(hospitalId, year, month);
    if (existing && existing.length > 0) return existing;

    const daysInMonth = new Date(year, month, 0).getDate();
    const out: ShiftAssignment[] = [];

    userIds.forEach(uid => {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = this.formatDate(year, month, d);
        const shift: ShiftType = d % 2 === 0 ? 'morning' : 'night'; // default pattern
        const a: ShiftAssignment = {
          id: uuidv4(),
          userId: uid,
          hospitalId,
          date,
          shift,
          manuallyAssigned: false
        };
        out.push(a);
      }
    });

    // merge with existing (none) and save
    const all = this.all().concat(out);
    // If using backend, persist created assignments via API
    if (!environment.useMock) {
      // TODO: POST new assignments to backend
    }
    this.saveAll(all);
    return out;
  }

  generateDefaultMonthIfEmpty$(hospitalId: string, userIds: number[], year: number, month: number): Observable<ShiftAssignment[]> {
    return of(this.generateDefaultMonthIfEmpty(hospitalId, userIds, year, month));
  }
}
