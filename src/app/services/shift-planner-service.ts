import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { ShiftAssignment, ShiftType } from '../models/shift-assignment';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ShiftPlannerService {
  // storage key stores an array of ShiftAssignment objects
  private readonly KEY = 'shift_planner_v1';

  constructor(private storage: StorageService) {
    if (!this.storage.get(this.KEY)) {
      this.storage.set(this.KEY, []);
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
  getMonthAssignments(hospitalId: number, year: number, month: number): ShiftAssignment[] {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.all().filter(a => a.hospitalId === hospitalId && a.date.startsWith(prefix));
  }

  /** Get assignment for a single user/date */
  getAssignmentFor(userId: number, hospitalId: number, date: string): ShiftAssignment | null {
    return this.all().find(a => a.userId === userId && a.hospitalId === hospitalId && a.date === date) || null;
  }

  /** Save or update a single assignment */
  saveAssignment(assign: { userId: number; hospitalId: number; date: string; shift: ShiftType; manuallyAssigned?: boolean }) {
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

  /** Remove assignment (set to no record) */
  removeAssignment(userId: number, hospitalId: number, date: string) {
    const arr = this.all().filter(a => !(a.userId === userId && a.hospitalId === hospitalId && a.date === date));
    this.saveAll(arr);
  }

  /**
   * Auto-generate a default monthly plan for given users if none exists yet.
   * - month: 1..12
   * - rule: sample alternating pattern, can be replaced by admin later
   * Returns the created assignments.
   */
  generateDefaultMonthIfEmpty(hospitalId: number, userIds: number[], year: number, month: number): ShiftAssignment[] {
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
    this.saveAll(all);
    return out;
  }
}
