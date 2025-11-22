import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { Roster } from '../models/roster';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';
// When switching to a backend, inject HttpClient and implement HTTP calls where marked.

@Injectable({
  providedIn: 'root'
})
export class RosterService {

  constructor(private storage: StorageService, private mockData: MockDataService) {
    this.seedMockData();  // <-- initialize mock roster data
  }

  /** Build storage key: one month per hospital */
  private getKey(hospitalId: number, year: number, month: number): string {
    return `mock_roster_${hospitalId}_${year}_${String(month).padStart(2, '0')}`;
  }

  /** Load roster for a given hospital & month */
  getRoster(hospitalId: number, year: number, month: number): Roster[] {
    if (!environment.useMock) {
      // TODO: call backend endpoint to fetch roster for (hospitalId, year, month)
      // e.g. return await firstValueFrom(this.http.get<Roster[]>(`/api/roster/${hospitalId}?year=${year}&month=${month}`));
    }
    return this.storage.get(this.getKey(hospitalId, year, month)) || [];
  }

  getRoster$(hospitalId: number, year: number, month: number): Observable<Roster[]> {
    return of(this.getRoster(hospitalId, year, month));
  }

  /** Save roster */
  private saveRoster(hospitalId: number, year: number, month: number, roster: Roster[]) {
    if (!environment.useMock) {
      // TODO: call backend to persist roster for the month
      // e.g. this.http.post(`/api/roster/${hospitalId}`, { year, month, roster })
    }
    this.storage.set(this.getKey(hospitalId, year, month), roster);
  }

  saveRoster$(hospitalId: number, year: number, month: number, roster: Roster[]): Observable<void> {
    this.saveRoster(hospitalId, year, month, roster);
    return of(void 0);
  }

  /** Auto-generate default roster for entire month */
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
          id: crypto.randomUUID(),
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

  generateDefaultRoster$(hospitalId: number, userIds: number[], year: number, month: number): Observable<Roster[]> {
    return of(this.generateDefaultRoster(hospitalId, userIds, year, month));
  }

  /** Admin overriding a shift */
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
      // TODO: if backend exists, call update endpoint for single entry
      this.saveRoster(hospitalId, year, month, roster);
    }
  }

  updateShift$(hospitalId: number, year: number, month: number, entryId: string, newShift: 'morning' | 'night' | 'off'): Observable<void> {
    this.updateShift(hospitalId, year, month, entryId, newShift);
    return of(void 0);
  }

  /** Fetch one user's shift for a specific date */
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

  getShiftForUserOnDate$(userId: number, dateISO: string, hospitalId: number): Observable<'morning' | 'night' | 'off' | null> {
    return of(this.getShiftForUserOnDate(userId, dateISO, hospitalId));
  }

  // --------------------------------------------------------
  // 🔥 MOCK DATA INITIALIZATION
  // --------------------------------------------------------
  private seedMockData() {
    if (!environment.useMock) return; // do not seed when using real backend

    const mockRoster = this.mockData.getRoster();

    mockRoster.forEach(entry => {
      const date = new Date(entry.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const key = this.getKey(entry.hospitalId, year, month);
      const existing = this.storage.get(key);

      // Only seed if storage is empty for that month
      if (!existing || existing.length === 0) {
        this.storage.set(key, mockRoster.filter(r =>
          r.hospitalId === entry.hospitalId &&
          r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
        ));
      }
    });
  }
}
