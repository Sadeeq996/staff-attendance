import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonItem, IonLabel, IonSelect, IonSelectOption,
  IonButton, IonHeader, IonContent, IonTitle, IonToolbar,
  IonModal, IonList, IonAvatar, IonGrid, IonRow, IonCol, IonChip, IonButtons
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { ShiftType } from 'src/app/models/shift-assignment';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shift-planner',
  templateUrl: './shift-planner.page.html',
  styleUrls: ['./shift-planner.page.scss'],
  standalone: true,
  imports: [IonButtons,
    IonToolbar, IonTitle, IonContent, IonHeader, CommonModule, FormsModule,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonButton,
    IonModal, IonList, IonAvatar, IonGrid, IonRow, IonCol, IonChip
  ]
})
export class ShiftPlannerPage implements OnInit {
  admin: any;
  users: any[] = [];
  year!: number;
  month!: number; // 1..12
  daysInMonth: number[] = [];
  selectedUserId!: number;
  assignmentsMap: Map<string, ShiftType> = new Map(); // date -> shift (for selected user)

  // modal/day view
  modalOpen = false;
  selectedDay: number | null = null;
  dayDateStr = '';
  dayAssignments: { user: any; shift: ShiftType }[] = [];

  constructor(private planner: ShiftPlannerService, private auth: AuthService) { }

  ngOnInit() {
    this.admin = this.auth.currentUser();
    this.loadMockUsers();
    this.setMonthTo(new Date().getFullYear(), new Date().getMonth() + 1);
    this.ensureMonthData();
    this.loadAssignmentsForSelectedUser();
  }

  loadMockUsers() {
    this.users = [
      { id: 1, fullName: 'Alice Nurse', hospitalId: this.admin.hospitalId },
      { id: 2, fullName: 'John Doe', hospitalId: this.admin.hospitalId },
      { id: 3, fullName: 'Mary Ward', hospitalId: this.admin.hospitalId }
    ];
    this.selectedUserId = this.users[0].id;
  }

  setMonthTo(y: number, m: number) {
    this.year = y; this.month = m;
    const days = new Date(this.year, this.month, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  prevMonth() {
    let m = this.month - 1, y = this.year;
    if (m < 1) { m = 12; y -= 1; }
    this.setMonthTo(y, m); this.ensureMonthData(); this.loadAssignmentsForSelectedUser();
  }
  nextMonth() {
    let m = this.month + 1, y = this.year;
    if (m > 12) { m = 1; y += 1; }
    this.setMonthTo(y, m); this.ensureMonthData(); this.loadAssignmentsForSelectedUser();
  }

  ensureMonthData() {
    const userIds = this.users.map(u => u.id);
    this.planner.generateDefaultMonthIfEmpty(this.admin.hospitalId!, userIds, this.year, this.month);
  }

  loadAssignmentsForSelectedUser() {
    this.assignmentsMap.clear();
    const items = this.planner.getMonthAssignments(this.admin.hospitalId!, this.year, this.month)
      .filter(a => a.userId === this.selectedUserId);
    items.forEach(a => this.assignmentsMap.set(a.date, a.shift));
  }

  getShift(day: number): ShiftType {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.assignmentsMap.get(date) || 'off';
  }

  changeShift(day: number, newShift: ShiftType) {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.planner.saveAssignment({ userId: this.selectedUserId, hospitalId: this.admin.hospitalId!, date, shift: newShift });
    this.loadAssignmentsForSelectedUser();
  }

  bulkAssign(shift: ShiftType) {
    this.daysInMonth.forEach(d => {
      const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.planner.saveAssignment({ userId: this.selectedUserId, hospitalId: this.admin.hospitalId!, date, shift });
    });
    this.loadAssignmentsForSelectedUser();
  }

  copyPreviousMonth() {
    let prevMonth = this.month - 1, prevYear = this.year;
    if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
    const prev = this.planner.getMonthAssignments(this.admin.hospitalId!, prevYear, prevMonth)
      .filter(a => a.userId === this.selectedUserId);
    prev.forEach(a => {
      this.planner.saveAssignment({
        userId: a.userId,
        hospitalId: a.hospitalId,
        date: `${this.year}-${String(this.month).padStart(2, '0')}-${a.date.slice(-2)}`,
        shift: a.shift
      });
    });
    this.loadAssignmentsForSelectedUser();
  }

  // --- Day modal / drawer handling (Option 3) ---

  openDay(day: number) {
    this.selectedDay = day;
    this.dayDateStr = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // load assignments for that day for all users
    const monthItems = this.planner.getMonthAssignments(this.admin.hospitalId!, this.year, this.month);
    this.dayAssignments = this.users.map(u => {
      const a = monthItems.find(it => it.userId === u.id && it.date === this.dayDateStr);
      return { user: u, shift: a ? a.shift : 'off' as ShiftType };
    });
    this.modalOpen = true;
  }

  closeDay() {
    this.modalOpen = false;
    this.selectedDay = null;
    this.dayAssignments = [];
  }

  assignShiftForUserInDay(userId: number, newShift: ShiftType) {
    if (!this.dayDateStr) return;
    this.planner.saveAssignment({ userId, hospitalId: this.admin.hospitalId!, date: this.dayDateStr, shift: newShift });
    // update local view
    this.dayAssignments = this.dayAssignments.map(d => d.user.id === userId ? { user: d.user, shift: newShift } : d);
    // Also refresh selectedUser map if selected user is same
    if (this.selectedUserId) this.loadAssignmentsForSelectedUser();
  }

  bulkAssignDay(newShift: ShiftType) {
    if (!this.dayDateStr) return;
    this.users.forEach(u => {
      this.planner.saveAssignment({ userId: u.id, hospitalId: this.admin.hospitalId!, date: this.dayDateStr, shift: newShift });
    });
    this.dayAssignments = this.dayAssignments.map(d => ({ user: d.user, shift: newShift }));
    if (this.selectedUserId) this.loadAssignmentsForSelectedUser();
  }

  // helper to compute counts per day for grid
  getCountsForDay(day: number) {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthItems = this.planner.getMonthAssignments(this.admin.hospitalId!, this.year, this.month);
    const dayItems = monthItems.filter(it => it.date === date);
    const counts = { morning: 0, night: 0, off: 0 };
    dayItems.forEach(it => {
      if (it.shift === 'morning') counts.morning++;
      else if (it.shift === 'night') counts.night++;
      else counts.off++;
    });
    return counts;
  }
}
