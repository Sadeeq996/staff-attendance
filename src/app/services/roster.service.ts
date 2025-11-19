import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Roster } from '../models/roster';

@Injectable({
  providedIn: 'root'
})
export class RosterService {

  private readonly KEY = 'mock_roster_v1';

  constructor(private storage: StorageService) {
    // initialize mock roster if not present
    if (!this.storage.get(this.KEY)) {
      const mock: Roster[] = generateMockRoster();
      this.storage.set(this.KEY, mock);
    }
  }

  getRoster(): Roster[] {
    return this.storage.get(this.KEY) || [];
  }

  getShiftForUserOnDate(userId: number, dateISO: string): 'morning' | 'night' | null {
    const roster: Roster[] = this.getRoster();
    const entry = roster.find(r => r.userId === userId && r.date === dateISO);
    return entry ? entry.shift : null;
  }
}

function generateMockRoster(): Roster[] {
  // for demo: assign alternating shifts for userId=1 for current month
  const entries: Roster[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().slice(0, 10);
    // alternate shifts: odd days = morning, even = night
    entries.push({ date: dateStr, userId: 1, shift: d % 2 === 1 ? 'morning' : 'night' });
  }
  return entries;
}
