import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonButton, IonAvatar, IonIcon, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AttendanceService } from 'src/app/services/attendance.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { MockDataService } from 'src/app/services/mock-data.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-staff-list',
  templateUrl: './staff-list.page.html',
  styleUrls: ['./staff-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonTitle, IonToolbar, IonHeader, CommonModule, IonList, IonItem, IonLabel, IonButton]
})
export class StaffListPage implements OnInit {
  admin: any;
  users: any[] = [];

  userShifts: Record<number, string> = {};
  clockedInMap: Record<number, boolean> = {};

  today = '';

  constructor(private auth: AuthService, private planner: ShiftPlannerService, private attendance: AttendanceService, private router: Router, private mockData: MockDataService) { }

  async ngOnInit() {
    this.admin = this.auth.currentUser();
    // load users from central mock data service filtered by admin's hospital
    this.users = this.mockData.getUsers().filter(u => u.hospitalId === this.admin.hospitalId);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.today = `${yyyy}-${mm}-${dd}`;

    // Precompute shifts and clocked-in state for each user
    await Promise.all(this.users.map(async (u) => {
      try {
        const a = await firstValueFrom(this.planner.getAssignmentFor$(u.id, u.hospitalId, this.today));
        this.userShifts[u.id] = a ? a.shift : 'off';
      } catch (e) {
        this.userShifts[u.id] = 'off';
      }
      try {
        const history = await firstValueFrom(this.attendance.getHistoryForUser$(u.id));
        this.clockedInMap[u.id] = history.some((r: any) => r.status === 'IN' && r.timestamp.startsWith(this.today));
      } catch (e) {
        this.clockedInMap[u.id] = false;
      }
    }));
  }

  getShiftForUser(u: any) {
    return this.userShifts[u.id] || 'off';
  }

  isClockedIn(u: any) {
    return !!this.clockedInMap[u.id];
  }

  goProfile(u: any) {
    this.router.navigateByUrl(`/profile?user=${u.id}`);
  }
}
