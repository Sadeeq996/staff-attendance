import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonCardTitle, IonCard, IonCardContent, IonCardHeader, IonNote } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AttendanceService } from 'src/app/services/attendance.service';
import { AuthService } from 'src/app/services/auth.service';
import { RosterService } from 'src/app/services/roster.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonNote, IonCardHeader, IonCardContent, IonCard, IonCardTitle, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DashboardPage implements OnInit {

  user: any;
  assignedShift: 'morning' | 'night' | null = null;
  message = '';
  // today: string = new Date().toDateString();
  today: string = '';
  displayDate: string = '';


  constructor(
    private auth: AuthService,
    private roster: RosterService,
    private attendance: AttendanceService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.auth.currentUser();
    console.log('Current user:', this.user);
    // const today = new Date().toISOString().slice(0, 10);
    // this.assignedShift = this.user ? this.roster.getShiftForUserOnDate(this.user.id, this.today) : null;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    this.today = `${yyyy}-${mm}-${dd}`;

    this.assignedShift = this.user ? this.roster.getShiftForUserOnDate(this.user.id, this.today) : null;
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    this.displayDate = new Date().toLocaleDateString(undefined, options); // e.g., "Wed, Nov 19, 2025"

  }

  async clockIn() {
    this.message = '';
    try {
      if (!this.assignedShift) throw new Error('No shift assigned today');
      this.attendance.clockIn(this.user.id, this.user.hospitalId, this.assignedShift);
      this.message = 'Clock In recorded';
    } catch (e: any) {
      this.message = e?.message || 'Failed';
    }
  }

  async clockOut() {
    this.message = '';
    try {
      if (!this.assignedShift) throw new Error('No shift assigned today');
      this.attendance.clockOut(this.user.id, this.user.hospitalId, this.assignedShift);
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
