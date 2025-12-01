import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonItem, IonLabel, IonSelect, IonSelectOption,
  IonButton, IonHeader, IonContent, IonTitle, IonToolbar,
  IonModal, IonList, IonAvatar, IonGrid, IonRow, IonCol, IonChip, IonButtons, IonNote
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { ShiftType, ShiftAssignment } from 'src/app/models/shift-assignment';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { User, users } from 'src/app/models/user';
import { MockDataService } from 'src/app/services/mock-data.service';

@Component({
  selector: 'app-shift-planner',
  templateUrl: './shift-planner.page.html',
  styleUrls: ['./shift-planner.page.scss'],
  standalone: true,
  imports: [IonNote, IonButtons,
    IonToolbar, IonTitle, IonContent, IonHeader, CommonModule, FormsModule,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonButton,
    IonModal, IonList, IonAvatar, IonChip]
})
export class ShiftPlannerPage implements OnInit {
  admin: any;
  users: any[] = [];
  year!: number;
  month!: number; // 1..12
  daysInMonth: number[] = [];
  selectedUserId!: number;
  assignmentsMap: Map<string, ShiftType> = new Map(); // date -> shift (for selected user)
  selectedUser: any;

  // modal/day view
  modalOpen = false;
  selectedDay: number | null = null;
  dayDateStr = '';
  dayAssignments: { user: User; shift: ShiftType }[] = [];

  constructor(private planner: ShiftPlannerService, private auth: AuthService, private userService: UserService, private mock: MockDataService) { }

  async ngOnInit() {
    this.admin = this.auth.currentUser();
    console.log('admin: ', this.admin);
    // this.users = this.mock.getUsers();
    // console.log('all users from mock: ', this.users);

    await this.loadUsersFromService();
    this.setMonthTo(new Date().getFullYear(), new Date().getMonth() + 1);
    await firstValueFrom(this.ensureMonthData$());
    await this.loadAssignmentsForSelectedUser();
  }

  async loadUsersFromService() {
    // load users for this admin's hospital using the UserService
    try {
      this.users = await firstValueFrom(this.userService.getUsers$(this.admin.hospitalId));
      if (this.users && this.users.length > 0) {
        console.log('users: ', this.users)
        this.selectedUserId = this.users[0].id;
      } else {
        // fallback: empty list
        this.users = [];
        this.selectedUserId = -1;
      }
    } catch (e) {
      console.error('Failed to load users for shift planner', e);
      this.users = [];
      this.selectedUserId = -1;
    }
  }

  setMonthTo(y: number, m: number) {
    this.year = y; this.month = m;
    const days = new Date(this.year, this.month, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  async prevMonth() {
    let m = this.month - 1, y = this.year;
    if (m < 1) { m = 12; y -= 1; }
    this.setMonthTo(y, m);
    await firstValueFrom(this.ensureMonthData$());
    await this.loadAssignmentsForSelectedUser();
  }

  async nextMonth() {
    let m = this.month + 1, y = this.year;
    if (m > 12) { m = 1; y += 1; }
    this.setMonthTo(y, m);
    await firstValueFrom(this.ensureMonthData$());
    await this.loadAssignmentsForSelectedUser();
  }

  ensureMonthData() {
    const userIds = this.users.map(u => u.id);
    if ((this.planner as any).generateDefaultMonthIfEmpty) {
      (this.planner as any).generateDefaultMonthIfEmpty(this.admin.hospitalId!, userIds, this.year, this.month);
    }
  }

  ensureMonthData$() {
    const userIds = this.users.map(u => u.id);
    return this.planner.generateDefaultMonthIfEmpty$(this.admin.hospitalId!, userIds, this.year, this.month);
  }

  async loadAssignmentsForSelectedUser() {
    this.assignmentsMap.clear();
    const items = (await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId!, this.year, this.month)))
      .filter(a => a.userId === this.selectedUserId);
    items.forEach(a => this.assignmentsMap.set(a.date, a.shift));
  }

  getShift(day: number): ShiftType {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.assignmentsMap.get(date) || 'off';
  }

  async changeShift(day: number, newShift: ShiftType) {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await this.saveAssignmentSafe({ userId: this.selectedUserId, hospitalId: this.admin.hospitalId!, date, shift: newShift });
    await this.loadAssignmentsForSelectedUser();
  }

  async bulkAssign(shift: ShiftType) {
    for (const d of this.daysInMonth) {
      const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      await this.saveAssignmentSafe({ userId: this.selectedUserId, hospitalId: this.admin.hospitalId!, date, shift });
    }
    await this.loadAssignmentsForSelectedUser();
  }

  async copyPreviousMonth() {
    let prevMonth = this.month - 1, prevYear = this.year;
    if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
    const prev = (await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId!, prevYear, prevMonth)))
      .filter(a => a.userId === this.selectedUserId);
    for (const a of prev) {
      await this.saveAssignmentSafe({
        userId: a.userId,
        hospitalId: a.hospitalId.toString(),
        date: `${this.year}-${String(this.month).padStart(2, '0')}-${a.date.slice(-2)}`,
        shift: a.shift
      });
    }
    await this.loadAssignmentsForSelectedUser();
  }

  // --- Day modal / drawer handling (Option 3) ---

  async openDay(day: number) {
    this.selectedDay = day;
    this.dayDateStr = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const monthItems = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId!, this.year, this.month));
    this.dayAssignments = this.users.map(u => {
      const a = monthItems.find(it => it.userId === u.id && it.date === this.dayDateStr);
      return { user: u, shift: a ? a.shift : 'off' as ShiftType };
    });

    this.modalOpen = true; // only open after dayAssignments is ready
  }


  closeDay() {
    this.modalOpen = false;
    this.selectedDay = null;
    this.dayAssignments = [];
  }

  async assignShiftForUserInDay(userId: number, newShift: ShiftType) {
    if (!this.dayDateStr) return;
    await this.saveAssignmentSafe({ userId, hospitalId: this.admin.hospitalId!, date: this.dayDateStr, shift: newShift });
    // update local view
    this.dayAssignments = this.dayAssignments.map(d => d.user.id === userId ? { user: d.user, shift: newShift } : d);
    // Also refresh selectedUser map if selected user is same
    if (this.selectedUserId) await this.loadAssignmentsForSelectedUser();
  }

  bulkAssignDay(newShift: ShiftType) {
    if (!this.dayDateStr) return;
    (async () => {
      for (const u of this.users) {
        await this.saveAssignmentSafe({ userId: u.id, hospitalId: this.admin.hospitalId!, date: this.dayDateStr, shift: newShift });
      }
      this.dayAssignments = this.dayAssignments.map(d => ({ user: d.user, shift: newShift }));
      if (this.selectedUserId) await this.loadAssignmentsForSelectedUser();
    })();
  }

  // helper to compute counts per day for grid
  getCountsForDay(day: number) {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // prefer observable variant if available
    // synchronous fallback for templates — try to fetch synchronously if planner exposes it
    const monthItems: ShiftAssignment[] = (this.planner as any).getMonthAssignments ? (this.planner as any).getMonthAssignments(this.admin.hospitalId!, this.year, this.month) : [];
    const dayItems = monthItems.filter((it: ShiftAssignment) => it.date === date);
    const counts = { morning: 0, night: 0, off: 0 };
    dayItems.forEach((it: ShiftAssignment) => {
      if (it.shift === 'morning') counts.morning++;
      else if (it.shift === 'night') counts.night++;
      else counts.off++;
    });
    return counts;
  }

  /**
   * Save assignment using Observable-based API if available, otherwise call sync method.
   */
  private async saveAssignmentSafe(a: { userId: number; hospitalId: string; date: string; shift: ShiftType; }) {
    if ((this.planner as any).saveAssignment$) {
      await firstValueFrom((this.planner as any).saveAssignment$(a));
    } else if ((this.planner as any).saveAssignment) {
      // sync fallback
      (this.planner as any).saveAssignment(a);
    } else {
      throw new Error('Planner save assignment method not found');
    }
  }
}