import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonCardTitle, IonCard, IonCardContent, IonCardHeader, IonNote, IonProgressBar, IonBackButton, IonMenuButton } from '@ionic/angular/standalone';
import { IonSpinner } from '@ionic/angular/standalone';
import { Router, RouterOutlet } from '@angular/router';
import { AttendanceService } from 'src/app/services/attendance.service';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';
import { ShiftType } from 'src/app/models/shift-assignment';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { ClockComponent } from 'src/app/shared/clock/clock.component';
import { ClockAnalogComponent } from 'src/app/shared/clock-analog/clock-analog.component';
import { SidebarComponent } from "src/app/shared/sidebar/sidebar.component";
import { ProgressRingComponent } from "src/app/shared/progress-ring/progress-ring.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonProgressBar,
    IonNote, IonCardHeader, IonCardContent, IonCard, IonCardTitle,
    IonSpinner,
    IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule, ClockComponent, ClockAnalogComponent, SidebarComponent, IonMenuButton, RouterOutlet, ProgressRingComponent]
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
  // UI state
  loading = true;
  clockingIn = false;
  clockingOut = false;

  //progressbar
  workedHours = 0;
  shiftTotalHours = 8; // 8-hour shift
  progress = 0;
  intervalId: any = null;

  constructor(
    private auth: AuthService,
    private planner: ShiftPlannerService,
    private attendance: AttendanceService,
    private router: Router,
    private toastCtrl: ToastController
  ) { }

  async ngOnInit() {
    this.loading = true;
    this.user = this.auth.currentUser();
    console.log('user: ', this.user)

    // const now = new Date();
    // const yyyy = now.getFullYear();
    // const mm = String(now.getMonth() + 1).padStart(2, '0');
    // const dd = String(now.getDate()).padStart(2, '0');
    // this.today = `${yyyy}-${mm}-${dd}`;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;
    const dd = now.getDate();
    this.today = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;


    await firstValueFrom(
      this.planner.generateDefaultMonthIfEmpty$(this.user.hospitalId!, [this.user.id], yyyy, mm)
    );

    // ensure data exists for current month for this hospital and user list
    // (if your system has API for users, replace with real user list)
    this.planner.generateDefaultMonthIfEmpty(this.user.hospitalId!, [this.user.id], yyyy, Number(mm));
    console.log('this.user.id:', this.user.id, typeof this.user.id);
    console.log('this.user.hospitalId:', this.user.hospitalId, typeof this.user.hospitalId);

    const assign = this.planner.getAssignmentFor(this.user.id, this.user.hospitalId!, this.today);
    console.log('Today assignment:', assign);
    this.assignedShift = assign ? assign.shift : null;

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    };
    this.displayDate = now.toLocaleDateString(undefined, options);

    // previous attendance
    try {
      const history = await firstValueFrom(this.attendance.getHistoryForUser$(this.user.id));
      const todayIn = history.find(r => r.status === 'IN' && r.timestamp.startsWith(this.today));
      if (todayIn) this.clockInTime = new Date(todayIn.timestamp);
      if (this.clockInTime && !this.clockOutTime) {
        this.startProgressTimer();
      }

      const todayOut = history.find(r => r.status === 'OUT' && r.timestamp.startsWith(this.today));
      if (todayOut) {
        this.clockOutTime = new Date(todayOut.timestamp);
        const mins = todayOut.durationMinutes ?? 0;
        this.durationText = `Duration worked: ${Math.floor(mins / 60)}h ${mins % 60}m`;
      }
    } catch (err: any) {
      this.message = err?.message || 'Failed loading attendance';
    } finally {
      this.loading = false;
    }
  }

  async clockIn() {
    this.message = '';
    if (!this.assignedShift || this.assignedShift === 'off') {
      this.message = 'No active shift assigned today';
      return;
    }
    if (this.clockInTime) return; // already clocked in

    // Navigate to scanner page
    this.router.navigate(['/qr-scanner']);

    const prev = this.clockInTime;
    this.clockingIn = true;
    const toast = await this.toastCtrl.create({ message: 'Clocking in...', duration: 0 });
    await toast.present();

    try {
      // optimistic update
      this.clockInTime = new Date();
      this.durationText = '';
      this.startProgressTimer();
      // the service may throw synchronously or return an observable that errors
      let obs;
      try {
        obs = this.attendance.clockIn$(this.user.id, this.user.hospitalId, this.assignedShift as any);
      } catch (syncErr) {
        throw syncErr;
      }
      const rec = await firstValueFrom(obs);
      this.clockInTime = new Date(rec.timestamp);
      this.startProgressTimer();
      this.message = 'Clock In recorded';
      await toast.dismiss();
      const ok = await this.toastCtrl.create({ message: 'Clock In recorded', duration: 1500 });
      await ok.present();
    } catch (e: any) {
      // rollback optimistic change
      this.clockInTime = prev ?? null;
      this.message = e?.message || 'Failed to clock in';
      await toast.dismiss();
      const err = await this.toastCtrl.create({ message: this.message, duration: 2000, color: 'danger' });
      await err.present();
    } finally {
      this.clockingIn = false;
    }
  }

  async clockOut() {
    this.message = '';
    if (!this.assignedShift || this.assignedShift === 'off') {
      this.message = 'No active shift assigned today';
      return;
    }
    if (!this.clockInTime) {
      this.message = 'You must clock in before clocking out';
      return;
    }

    const prevOut = this.clockOutTime;
    const prevDuration = this.durationText;
    this.clockingOut = true;
    const toast = await this.toastCtrl.create({ message: 'Clocking out...', duration: 0 });
    await toast.present();

    try {
      // optimistic update
      const now = new Date();
      this.clockOutTime = now;
      const mins = Math.floor((now.getTime() - (this.clockInTime?.getTime() || now.getTime())) / 1000 / 60);
      this.durationText = `Duration worked: ${Math.floor(mins / 60)}h ${mins % 60}m`;

      let obs;
      try {
        obs = this.attendance.clockOut$(this.user.id, this.user.hospitalId, this.assignedShift as any);
      } catch (syncErr) {
        throw syncErr;
      }
      const rec = await firstValueFrom(obs);
      this.clockOutTime = new Date(rec.timestamp);
      const mins2 = rec.durationMinutes ?? 0;
      this.durationText = `Duration worked: ${Math.floor(mins2 / 60)}h ${mins2 % 60}m`;
      this.message = 'Clock Out recorded';
      await toast.dismiss();
      const ok = await this.toastCtrl.create({ message: 'Clock Out recorded', duration: 1500 });
      await ok.present();
    } catch (e: any) {
      // rollback optimistic
      this.clockOutTime = prevOut ?? null;
      this.durationText = prevDuration ?? '';
      this.message = e?.message || 'Failed to clock out';
      await toast.dismiss();
      const err = await this.toastCtrl.create({ message: this.message, duration: 2000, color: 'danger' });
      await err.present();
    } finally {
      this.clockingOut = false;
    }
  }

  goShifts() {
    this.router.navigateByUrl('/my-shifts');
  }

  goHistory() {
    this.router.navigateByUrl('/history');
  }

  logout() {
    this.auth.logout();
  }

  startProgressTimer() {
    if (!this.clockInTime) return;

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - this.clockInTime!.getTime();
      const hours = diffMs / (1000 * 60 * 60); // convert ms → hours

      this.workedHours = hours;
      this.progress = Math.min(hours / this.shiftTotalHours, 1);
    }, 1000); // update every second
  }

  stopProgressTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get remainingTimeText(): string {
    const remaining = this.shiftTotalHours - this.workedHours;
    if (remaining <= 0) return 'Shift completed';

    const hrs = Math.floor(remaining);
    const mins = Math.floor((remaining % 1) * 60);
    return `${hrs}h ${mins}m remaining`;
  }
}
