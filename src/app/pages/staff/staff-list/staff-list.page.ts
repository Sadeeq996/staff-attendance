import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonButton, IonAvatar, IonIcon, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AttendanceService } from 'src/app/services/attendance.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
@Component({
  selector: 'app-staff-list',
  templateUrl: './staff-list.page.html',
  styleUrls: ['./staff-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonTitle, IonToolbar, IonHeader, CommonModule, IonList, IonItem, IonLabel, IonButton, IonAvatar, IonIcon]
})
export class StaffListPage implements OnInit {
  admin: any;
  users: any[] = [];

  today = '';

  constructor(private auth: AuthService, private planner: ShiftPlannerService, private attendance: AttendanceService, private router: Router) { }

  ngOnInit() {
    this.admin = this.auth.currentUser();
    // replace with actual users source; using mock for now
    this.users = [
      { id: 1, fullName: 'Alice Nurse', email: 'staff@attendance.com', hospitalId: this.admin.hospitalId },
      { id: 2, fullName: 'John Doe', email: 'john@attendance.com', hospitalId: this.admin.hospitalId }
    ];

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.today = `${yyyy}-${mm}-${dd}`;
  }

  getShiftForUser(u: any) {
    const a = this.planner.getAssignmentFor(u.id, u.hospitalId, this.today);
    return a ? a.shift : 'off';
  }

  isClockedIn(u: any) {
    const history = this.attendance.getHistoryForUser(u.id);
    return history.some(r => r.status === 'IN' && r.timestamp.startsWith(this.today));
  }

  goProfile(u: any) {
    this.router.navigateByUrl(`/profile?user=${u.id}`);
  }
}
