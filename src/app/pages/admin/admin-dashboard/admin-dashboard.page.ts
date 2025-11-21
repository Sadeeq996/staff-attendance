import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { AttendanceService } from 'src/app/services/attendance.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, IonTitle, IonToolbar, IonHeader, CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonGrid, IonRow, IonCol]
})
export class AdminDashboardPage implements OnInit {
  admin: any;
  totalStaff = 0;
  clockedInCount = 0;
  shiftCounts: { morning: number; night: number; off: number } = { morning: 0, night: 0, off: 0 };
  today = '';

  constructor(
    private auth: AuthService,
    private attendance: AttendanceService,
    private planner: ShiftPlannerService
  ) { }

  ngOnInit() {
    this.admin = this.auth.currentUser();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.today = `${yyyy}-${mm}-${dd}`;

    // for now use mock users from AuthService (or replace with real)
    const users = this.getUsersForHospital(this.admin.hospitalId!);
    this.totalStaff = users.length;

    // attendance
    const allTodayIns = this.attendance.getHistoryForUser(-1) // placeholder, we'll compute differently
    // more reliable: inspect attendance storage directly via service (we'll add helper)
    const allRecords = (this.attendance as any).all?.() || [];
    const todaysIn = allRecords.filter((r: any) => r.status === 'IN' && r.timestamp.startsWith(this.today));
    const uniqueClockedIn = new Set(todaysIn.map((r: any) => r.userId));
    this.clockedInCount = uniqueClockedIn.size;

    // shift distribution
    const month = Number(mm);
    const assignments = this.planner.getMonthAssignments(this.admin.hospitalId!, yyyy, month);
    const todayAssigns = assignments.filter(a => a.date === this.today);
    this.shiftCounts = { morning: 0, night: 0, off: 0 };
    todayAssigns.forEach(a => {
      if (a.shift === 'morning') this.shiftCounts.morning++;
      else if (a.shift === 'night') this.shiftCounts.night++;
      else this.shiftCounts.off++;
    });
  }

  getUsersForHospital(hospitalId: number) {
    // temporary - use AuthService mock users or provide real user service
    // if AuthService had stored mockUsers you can expose via a method; for now recreate:
    return [
      { id: 1, fullName: 'Alice Nurse', hospitalId },
      { id: 2, fullName: 'John Doe', hospitalId },
      { id: 3, fullName: 'Mary Ward', hospitalId }
    ];
  }
}
