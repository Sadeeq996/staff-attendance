import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Roster } from '../models/roster';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class RosterService {

  constructor(private storage: StorageService) { }

  /** Build storage key: one month per hospital */
  private getKey(hospitalId: number, year: number, month: number): string {
    return `mock_roster_${hospitalId}_${year}_${String(month).padStart(2, '0')}`;
  }

  /** Load roster for a given hospital & month */
  getRoster(hospitalId: number, year: number, month: number): Roster[] {
    return this.storage.get(this.getKey(hospitalId, year, month)) || [];
  }

  /** Save roster */
  private saveRoster(hospitalId: number, year: number, month: number, roster: Roster[]) {
    this.storage.set(this.getKey(hospitalId, year, month), roster);
  }

  /** Auto-generate default roster for entire month & multiple users */
  generateDefaultRoster(
    hospitalId: number,
    userIds: number[],
    year: number,
    month: number
  ): Roster[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const roster: Roster[] = [];

    userIds.forEach(userId => {
      for (let day = 1; day <= daysInMonth; day++) {
        roster.push({
          id: uuidv4(),
          userId,
          hospitalId,
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          shift: day % 2 === 0 ? 'morning' : 'night',
          manuallyAssigned: false
        });
      }
    });

    this.saveRoster(hospitalId, year, month, roster);
    return roster;
  }

  /** Admin overriding a shift manually */
  updateShift(
    hospitalId: number,
    year: number,
    month: number,
    entryId: string,
    newShift: 'morning' | 'night' | 'off'
  ) {
    const roster = this.getRoster(hospitalId, year, month);
    const index = roster.findIndex(r => r.id === entryId);

    if (index !== -1) {
      roster[index].shift = newShift;
      roster[index].manuallyAssigned = true;
      this.saveRoster(hospitalId, year, month, roster);
    }
  }

  /** Get user shift for specific date (same method signature you already use) */
  getShiftForUserOnDate(
    userId: number,
    dateISO: string,
    hospitalId: number
  ): 'morning' | 'night' | 'off' | null {
    const dateObj = new Date(dateISO);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    const roster = this.getRoster(hospitalId, year, month);

    const entry = roster.find(r => r.userId === userId && r.date === dateISO);
    return entry ? entry.shift : null;
  }
}
