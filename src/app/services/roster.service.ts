import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { Roster } from '../models/roster';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';
import { GoogleSheetsService } from './google-sheets';
import { map, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class RosterService {
  constructor(
    private storage: StorageService,
    private mockData: MockDataService,
    private gs: GoogleSheetsService
  ) {
    this.seedMockData();
  }

  private getKey(hospitalId: string, year: number, month: number): string {
    return `mock_roster_${hospitalId}_${year}_${String(month).padStart(2, '0')}`;
  }

  private allLocalForMonth(hospitalId: string, year: number, month: number): Roster[] {
    return this.storage.get(this.getKey(hospitalId, year, month)) || [];
  }

  getRoster$(hospitalId: string, year: number, month: number): Observable<Roster[]> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.list('roster').pipe(
        map((rows: any[]) => rows.filter(r => r.hospitalId === hospitalId && r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))),
        catchError(() => of(this.allLocalForMonth(hospitalId, year, month)))
      );
    }
    return of(this.allLocalForMonth(hospitalId, year, month));
  }

  saveRoster$(hospitalId: string, year: number, month: number, roster: Roster[]): Observable<void> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      // Use replaceMonthRoster atomic API for simplicity
      return this.gs.replaceMonthRoster(hospitalId, year, month, roster).pipe(
        map(() => {
          // update local cache
          this.storage.set(this.getKey(hospitalId, year, month), roster);
          return void 0;
        }),
        catchError(() => {
          this.storage.set(this.getKey(hospitalId, year, month), roster);
          return of(void 0);
        })
      ) as Observable<void>;
    }
    this.storage.set(this.getKey(hospitalId, year, month), roster);
    return of(void 0);
  }

  generateDefaultRoster(hospitalId: string, userIds: number[], year: number, month: number): Roster[] {
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

  private saveRoster(hospitalId: string, year: number, month: number, roster: Roster[]) {
    this.storage.set(this.getKey(hospitalId, year, month), roster);
  }

  private seedMockData() {
    if (!environment.useMock) return;
    const mockRoster = this.mockData.getRoster();
    mockRoster.forEach(entry => {
      const date = new Date(entry.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = this.getKey(entry.hospitalId, year, month);
      const existing = this.storage.get(key);
      if (!existing || existing.length === 0) {
        this.storage.set(key, mockRoster.filter(r => r.hospitalId === entry.hospitalId && r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)));
      }
    });
  }
}
