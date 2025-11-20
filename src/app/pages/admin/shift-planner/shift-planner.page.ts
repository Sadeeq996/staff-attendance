import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonItem, IonSelectOption, IonSelect } from '@ionic/angular/standalone';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { ShiftAssignment, ShiftType } from 'src/app/models/shift-assignment';


@Component({
  selector: 'app-shift-planner',
  templateUrl: './shift-planner.page.html',
  styleUrls: ['./shift-planner.page.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonSelectOption, IonSelect]
})
export class ShiftPlannerPage implements OnInit {

  admin!: User;
  users: User[] = [];
  year!: number;
  month!: number; // 1..12
  daysInMonth: number[] = [];
  selectedUserId!: number;
  assignments: Map<string, ShiftAssignment> = new Map(); // key=date -> assignment

  constructor(
    private planner: ShiftPlannerService,
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.admin = this.auth.currentUser()!;
    this.loadMockUsers(); // replace with API users later
    this.setCurrentMonth();
    this.ensureMonthData();
    this.loadAssignmentsForSelectedUser();
  }

  loadMockUsers() {
    this.users = [
      { id: 1, email: 'staff@attendance.com', fullName: 'Alice Nurse', role: 'staff', hospitalId: 1 },
      { id: 2, email: 'another@attendance.com', fullName: 'John Doe', role: 'staff', hospitalId: 1 },
      { id: 3, email: 'admin@attendance.com', fullName: 'Bob Admin', role: 'hospital_admin', hospitalId: 1 }
    ];
    this.selectedUserId = this.users[0].id;
  }

  setCurrentMonth() {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth() + 1;
    const days = new Date(this.year, this.month, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  ensureMonthData() {
    const userIds = this.users.map(u => u.id);
    this.planner.generateDefaultMonthIfEmpty(this.admin.hospitalId!, userIds, this.year, this.month);
  }

  loadAssignmentsForSelectedUser() {
    this.assignments.clear();
    const items = this.planner.getMonthAssignments(this.admin.hospitalId!, this.year, this.month)
      .filter(a => a.userId === this.selectedUserId);
    items.forEach(a => this.assignments.set(a.date, a));
  }

  getShiftForDay(day: number): ShiftType {
    const d = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const a = this.assignments.get(d);
    return a ? a.shift : 'off';
  }

  async changeShift(day: number, newShift: ShiftType) {
    const date = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.planner.saveAssignment({
      userId: this.selectedUserId,
      hospitalId: this.admin.hospitalId!,
      date,
      shift: newShift
    });
    // reload assignments map for UI
    this.loadAssignmentsForSelectedUser();
  }

  // navigation helpers if you want prev/next month
  prevMonth() { /* implement if desired */ }
  nextMonth() { /* implement if desired */ }

}
