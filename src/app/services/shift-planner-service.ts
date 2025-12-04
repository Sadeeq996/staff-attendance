import { Injectable } from '@angular/core';
import { Observable, from, firstValueFrom } from 'rxjs';
import { ShiftAssignment, ShiftType } from '../models/shift-assignment';
import { GoogleSheetsService } from './google-sheets';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShiftPlannerService {

  constructor(private gs: GoogleSheetsService) { }

  /** Format YYYY-MM-DD */
  private formatDate(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /** Fetch all roster entries from Google Sheets */
  // private async getRoster(): Promise<any[]> {
  //   const roster = await firstValueFrom(this.gs.list('roster')) as any[];
  //   return roster || [];
  // }

  private async getRoster(): Promise<any[]> {
    try {
      const roster = await firstValueFrom(this.gs.list('roster')) as any[] || [];
      return roster.map(r => {
        const dateObj = new Date(r.date); // parse ISO or date string
        const dateLocal = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        return {
          __raw: r,
          id: r.id ? String(r.id).trim() : '',
          userId: (r.userId !== undefined && r.userId !== null) ? Number(r.userId) : NaN,
          hospitalId: r.hospitalId !== undefined && r.hospitalId !== null ? String(r.hospitalId).trim() : '',
          date: r.date ? String(r.date).trim() : '',
          dateLocal,                //  add local date
          shift: r.shift ? String(r.shift).trim().toLowerCase() : '',
          manuallyAssigned: !!r.manuallyAssigned
        };
      });
    } catch (err) {
      console.error('ShiftPlannerService.getRoster error', err);
      return [];
    }
  }


  /** Debug helper - returns roster and logs some summary info */
  async debugRoster() {
    const roster = await this.getRoster();
    console.log('ShiftPlannerService roster length:', roster.length);
    // show first 10 rows
    console.log('Roster sample (first 10):', roster.slice(0, 10));
    return roster;
  }


  /** Get assignments for a hospital and month */
  async getMonthAssignments(hospitalId: string, year: number, month: number): Promise<ShiftAssignment[]> {
    const roster = await this.getRoster();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return roster
      .filter(r => r.hospitalId === hospitalId && r.date.startsWith(prefix))
      .map(r => ({
        id: r.id,
        userId: Number(r.userId),
        hospitalId: r.hospitalId,
        date: r.date,
        shift: r.shift as ShiftType,
        manuallyAssigned: !!r.manuallyAssigned
      }));
  }

  getMonthAssignments$(hospitalId: string, year: number, month: number): Observable<ShiftAssignment[]> {
    return from(this.getMonthAssignments(hospitalId, year, month));
  }

  // /** Get assignment for a single user/date */
  // async getAssignmentFor(userId: number, hospitalId: string, date: string): Promise<ShiftAssignment | null> {
  //   const roster = await this.getRoster();
  //   const r = roster.find(r => r.userId == userId && r.hospitalId === hospitalId && r.date === date);
  //   if (!r) return null;
  //   return {
  //     id: r.id,
  //     userId: Number(r.userId),
  //     hospitalId: r.hospitalId,
  //     date: r.date,
  //     shift: r.shift as ShiftType,
  //     manuallyAssigned: !!r.manuallyAssigned
  //   };
  // }


  /** Get assignment for a single user/date — robust comparisons and logging */
  /** Get assignment for a single user/date — robust comparisons using local date */
  async getAssignmentFor(
    userId: number,
    hospitalId: string,
    date: string
  ): Promise<ShiftAssignment | null> {
    const roster = await this.getRoster();

    // Normalize inputs
    const uid = Number(userId);
    const hid = String(hospitalId).trim();
    const dt = String(date).trim(); // expected in YYYY-MM-DD

    console.debug('getAssignmentFor inputs:', { uid, hid, dt });

    // Find row using dateLocal instead of ISO date to avoid UTC mismatches
    const r = roster.find(row =>
      !Number.isNaN(Number(row.userId)) &&
      Number(row.userId) === uid &&
      String(row.hospitalId) === hid &&
      row.dateLocal === dt
    );

    if (!r) {
      console.warn('No matching roster row found for', { uid, hid, dt });
      console.table(
        roster.slice(0, 20).map(r => ({
          userId: r.userId,
          hospitalId: r.hospitalId,
          date: r.date,
          dateLocal: r.dateLocal,
          shift: r.shift
        }))
      );
      return null;
    }

    return {
      id: r.id,
      userId: Number(r.userId),
      hospitalId: r.hospitalId,
      date: r.date,
      shift: (r.shift || 'off') as ShiftType,
      manuallyAssigned: !!r.manuallyAssigned
    };
  }


  getAssignmentFor$(userId: number, hospitalId: string, date: string): Observable<ShiftAssignment | null> {
    return from(this.getAssignmentFor(userId, hospitalId, date));
  }

  /** Save or update a single assignment */
  async saveAssignment(assign: { userId: number; hospitalId: string; date: string; shift: ShiftType; manuallyAssigned?: boolean }) {
    const roster = await this.getRoster();
    const existing = roster.find(r => r.userId == assign.userId && r.hospitalId === assign.hospitalId && r.date === assign.date);

    if (existing) {
      // update
      await firstValueFrom(this.gs.update('roster', { ...existing, ...assign }));
    } else {
      // create
      await firstValueFrom(this.gs.create('roster', { ...assign, id: `${Date.now()}-${Math.floor(Math.random() * 10000)}` }));
    }
  }

  saveAssignment$(assign: { userId: number; hospitalId: string; date: string; shift: ShiftType; manuallyAssigned?: boolean }): Observable<void> {
    return from(this.saveAssignment(assign));
  }

  /** Remove assignment */
  async removeAssignment(userId: number, hospitalId: string, date: string) {
    const roster = await this.getRoster();
    const existing = roster.find(r => r.userId == userId && r.hospitalId === hospitalId && r.date === date);
    if (!existing) return;

    await firstValueFrom(this.gs.delete('roster', existing.id));
  }

  removeAssignment$(userId: number, hospitalId: string, date: string): Observable<void> {
    return from(this.removeAssignment(userId, hospitalId, date));
  }

  /**
   * Auto-generate a default monthly plan for given users if none exists yet.
   * - month: 1..12
   * - pattern: alternating morning/night
   */
  async generateDefaultMonthIfEmpty(
    hospitalId: string,
    userIds: number[],
    year: number,
    month: number
  ): Promise<ShiftAssignment[]> {
    const existing = await this.getMonthAssignments(hospitalId, year, month);
    if (existing.length > 0) return existing;

    const daysInMonth = new Date(year, month, 0).getDate();
    const out: ShiftAssignment[] = [];

    for (const uid of userIds) {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = this.formatDate(year, month, d);

        // create local Date object to generate dateLocal
        const dateObj = new Date(`${date}T00:00:00`);
        const dateLocal = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        const shift: ShiftType = d % 2 === 0 ? 'morning' : 'night';
        const assignment: ShiftAssignment = {
          id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          userId: uid,
          hospitalId,
          date,       // original ISO-like date string
          shift,
          manuallyAssigned: false,
          dateLocal   // add local date
        };
        out.push(assignment);

        await firstValueFrom(this.gs.create('roster', assignment));
      }
    }

    return out;
  }


  generateDefaultMonthIfEmpty$(hospitalId: string, userIds: number[], year: number, month: number): Observable<ShiftAssignment[]> {
    return from(this.generateDefaultMonthIfEmpty(hospitalId, userIds, year, month));
  }
}
