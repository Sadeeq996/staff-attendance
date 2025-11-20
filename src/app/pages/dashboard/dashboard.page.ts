import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonCardTitle, IonCard,
  IonCardContent, IonCardHeader, IonNote
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AttendanceService } from 'src/app/services/attendance.service';
import { AuthService } from 'src/app/services/auth.service';
import { ShiftType } from 'src/app/models/shift-assignment';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonNote, IonCardHeader, IonCardContent, IonCard, IonCardTitle,
    IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule
  ]
})
export class DashboardPage implements OnInit {

  user: any;
  assignedShift: ShiftType | null = null;
  message = '';
  today: string = '';
  displayDate: string = '';
  clockInTime: Date | null = null;
  clockOutTime: Date | null = null;
  durationText: string = '';

  constructor(
    private auth: AuthService,
    private planner: ShiftPlannerService,
    private attendance: AttendanceService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.auth.currentUser();

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.today = `${yyyy}-${mm}-${dd}`;

    // ensure data exists for current month for this hospital and user list
    // (if your system has API for users, replace with real user list)
    this.planner.generateDefaultMonthIfEmpty(this.user.hospitalId!, [this.user.id], yyyy, Number(mm));

    const assign = this.planner.getAssignmentFor(this.user.id, this.user.hospitalId!, this.today);
    this.assignedShift = assign ? assign.shift : null;

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    };
    this.displayDate = now.toLocaleDateString(undefined, options);

    // previous attendance
    const history = this.attendance.getHistoryForUser(this.user.id);
    const todayIn = history.find(r => r.status === 'IN' && r.timestamp.startsWith(this.today));
    if (todayIn) this.clockInTime = new Date(todayIn.timestamp);
    const todayOut = history.find(r => r.status === 'OUT' && r.timestamp.startsWith(this.today));
    if (todayOut) {
      this.clockOutTime = new Date(todayOut.timestamp);
      const mins = todayOut.durationMinutes ?? 0;
      this.durationText = `Duration worked: ${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
  }

  async clockIn() {
    this.message = '';
    try {
      if (!this.assignedShift || this.assignedShift === 'off') throw new Error('No active shift assigned today');
      const rec = this.attendance.clockIn(this.user.id, this.user.hospitalId, this.assignedShift);
      this.clockInTime = new Date(rec.timestamp);
      this.message = 'Clock In recorded';
      this.durationText = '';
    } catch (e: any) {
      this.message = e?.message || 'Failed';
    }
  }

  async clockOut() {
    this.message = '';
    try {
      if (!this.assignedShift || this.assignedShift === 'off') throw new Error('No active shift assigned today');
      const rec = this.attendance.clockOut(this.user.id, this.user.hospitalId, this.assignedShift);
      this.clockOutTime = new Date(rec.timestamp);
      const mins = rec.durationMinutes ?? 0;
      this.durationText = `Duration worked: ${Math.floor(mins / 60)}h ${mins % 60}m`;
      this.message = 'Clock Out recorded';
    } catch (e: any) {
      this.message = e?.message || 'Failed';
    }
  }

  goHistory() {
    this.router.navigateByUrl('/history');
  }

  logout() {
    this.auth.logout();
  }
}
