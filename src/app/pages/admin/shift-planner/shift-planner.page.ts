import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonItem, IonLabel, IonSelect, IonSelectOption,
  IonButton, IonHeader, IonContent, IonTitle, IonToolbar,
  IonModal, IonList, IonAvatar, IonChip, IonButtons, IonNote
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from 'src/app/services/auth.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { UserService } from 'src/app/services/user.service';
import { ShiftType, ShiftAssignment } from 'src/app/models/shift-assignment';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-shift-planner',
  templateUrl: './shift-planner.page.html',
  styleUrls: ['./shift-planner.page.scss'],
  standalone: true,
  imports: [
    IonNote, IonButtons, IonToolbar, IonTitle, IonContent, IonHeader,
    CommonModule, FormsModule,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonButton,
    IonModal, IonList, IonAvatar, IonChip
  ]
})
export class ShiftPlannerPage implements OnInit {
  admin!: any;
  users: User[] = [];
  year!: number;
  month!: number;
  daysInMonth: number[] = [];
  selectedUserId!: number;
  assignmentsMap = new Map<string, ShiftType>(); // selected user's assignments
  selectedUser!: User;
  dayCounts: Record<number, Record<ShiftType, number>> = {};



  // modal/day view
  modalOpen = false;
  selectedDay: number | null = null;
  dayDateStr = '';
  dayAssignments: { user: User; shift: ShiftType }[] = [];

  constructor(
    private auth: AuthService,
    private planner: ShiftPlannerService,
    private userService: UserService
  ) { }

  async ngOnInit() {
    this.admin = this.auth.currentUser();
    await this.loadUsers();
    this.setMonthTo(new Date().getFullYear(), new Date().getMonth() + 1);
    await firstValueFrom(this.ensureMonthData$());
    await this.loadAssignmentsForSelectedUser();
  }

  private async loadUsers() {
    try {
      this.users = await firstValueFrom(this.userService.getUsers$(this.admin.hospitalId));
      if (this.users.length > 0) this.selectedUserId = this.users[0].id;
      else this.selectedUserId = -1;
    } catch (e) {
      console.error('Failed to load users', e);
      this.users = [];
      this.selectedUserId = -1;
    }
  }

  async updateDayCounts() {
    this.dayCounts = {}; // reset
    for (const d of this.daysInMonth) {
      this.dayCounts[d] = await this.getCountsForDay(d);
    }
  }


  setMonthTo(y: number, m: number) {
    this.year = y;
    this.month = m;
    const days = new Date(this.year, this.month, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  async prevMonth() {
    let m = this.month - 1, y = this.year;
    if (m < 1) { m = 12; y--; }
    this.setMonthTo(y, m);
    await firstValueFrom(this.ensureMonthData$());
    await this.loadAssignmentsForSelectedUser();
  }

  async nextMonth() {
    let m = this.month + 1, y = this.year;
    if (m > 12) { m = 1; y++; }
    this.setMonthTo(y, m);
    await firstValueFrom(this.ensureMonthData$());
    await this.loadAssignmentsForSelectedUser();
  }

  ensureMonthData$() {
    const userIds = this.users.map(u => u.id);
    return this.planner.generateDefaultMonthIfEmpty$(this.admin.hospitalId, userIds, this.year, this.month);
  }

  async loadAssignmentsForSelectedUser() {
    this.assignmentsMap.clear();
    const allAssignments = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId, this.year, this.month));
    const userAssignments = allAssignments.filter(a => a.userId === this.selectedUserId);
    userAssignments.forEach(a => this.assignmentsMap.set(a.date, a.shift));
    await this.updateDayCounts();
  }

  getShift(day: number): ShiftType {
    const date = this.formatDate(day);
    return this.assignmentsMap.get(date) || 'off';
  }

  async changeShift(day: number, newShift: ShiftType) {
    const date = this.formatDate(day);
    await this.saveAssignment({ userId: this.selectedUserId, hospitalId: this.admin.hospitalId, date, shift: newShift });
    await this.loadAssignmentsForSelectedUser();
  }

  async bulkAssign(shift: ShiftType) {
    for (const d of this.daysInMonth) {
      const date = this.formatDate(d);
      await this.saveAssignment({ userId: this.selectedUserId, hospitalId: this.admin.hospitalId, date, shift });
    }
    await this.loadAssignmentsForSelectedUser();
  }

  async copyPreviousMonth() {
    let prevMonth = this.month - 1, prevYear = this.year;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prevAssignments = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId, prevYear, prevMonth));
    const userPrevAssignments = prevAssignments.filter(a => a.userId === this.selectedUserId);
    for (const a of userPrevAssignments) {
      const date = `${this.year}-${String(this.month).padStart(2, '0')}-${a.date.slice(-2)}`;
      await this.saveAssignment({ userId: a.userId, hospitalId: a.hospitalId, date, shift: a.shift });
    }
    await this.loadAssignmentsForSelectedUser();
  }

  async openDay(day: number) {
    this.selectedDay = day;
    this.dayDateStr = this.formatDate(day);

    const monthAssignments = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId, this.year, this.month));
    this.dayAssignments = this.users.map(u => {
      const a = monthAssignments.find(m => m.userId === u.id && m.date === this.dayDateStr);
      return { user: u, shift: a ? a.shift : 'off' };
    });
    this.modalOpen = true;
  }

  closeDay() {
    this.modalOpen = false;
    this.selectedDay = null;
    this.dayAssignments = [];
  }

  async assignShiftForUserInDay(userId: number, newShift: ShiftType) {
    if (!this.dayDateStr) return;
    await this.saveAssignment({ userId, hospitalId: this.admin.hospitalId, date: this.dayDateStr, shift: newShift });
    this.dayAssignments = this.dayAssignments.map(d => d.user.id === userId ? { user: d.user, shift: newShift } : d);
    await this.loadAssignmentsForSelectedUser();
  }

  async bulkAssignDay(newShift: ShiftType) {
    if (!this.dayDateStr) return;
    for (const u of this.users) {
      await this.saveAssignment({ userId: u.id, hospitalId: this.admin.hospitalId, date: this.dayDateStr, shift: newShift });
    }
    this.dayAssignments = this.dayAssignments.map(d => ({ user: d.user, shift: newShift }));
    await this.loadAssignmentsForSelectedUser();
    
  }

  async getCountsForDay(day: number): Promise<Record<ShiftType, number>> {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthItems: ShiftAssignment[] = await firstValueFrom(
      this.planner.getMonthAssignments$(this.admin.hospitalId!, this.year, this.month)
    );
    const dayItems = monthItems.filter(it => it.date === date);

    const counts: Record<ShiftType, number> = { morning: 0, night: 0, off: 0 };
    dayItems.forEach(it => {
      counts[it.shift] = (counts[it.shift] || 0) + 1;
    });
    return counts;
  }



  private formatDate(day: number) {
    return `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private async saveAssignment(a: { userId: number; hospitalId: string; date: string; shift: ShiftType }) {
    await firstValueFrom(this.planner.saveAssignment$(a));
  }
}
