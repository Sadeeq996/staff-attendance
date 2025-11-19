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
      console.log('Initializing mock roster data', mock);
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

// function generateMockRoster(): Roster[] {
//   // for demo: assign alternating shifts for userId=1 for current month
//   const entries: Roster[] = [];
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = today.getMonth();
//   const daysInMonth = new Date(year, month + 1, 0).getDate();

//   console.log('Generating mock roster for', year, month + 1, 'with', daysInMonth, 'days');

//   for (let d = 1; d <= daysInMonth; d++) {
//     const date = new Date(year, month, d);
//     // const dateStr = date.toISOString().slice(0, 10);
//     // toISOString() converts your local date to UTC, shifting it backwards
//     // Your system timezone is UTC + 1(Nigeria). So roster always starts one day early.
//     // This is not a bug in logic. It’s a JavaScript timezone conversion trap.
//     // THE FIX (Use local date, NEVER toISOString)
//     const dateStr = date.toLocaleDateString('en-CA');
//     // en-CA gives YYYY-MM-DD format
//     // alternate shifts: odd days = morning, even = night
//     entries.push({ date: dateStr, userId: 1, shift: d % 2 === 1 ? 'morning' : 'night' });
//   }
//   return entries;
// }

function generateMockRoster(): Roster[] {
  const entries: Roster[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);

    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');

    entries.push({
      date: dateStr,
      userId: 1,
      shift: d % 2 === 1 ? 'morning' : 'night'
    });
  }

  return entries;
}
