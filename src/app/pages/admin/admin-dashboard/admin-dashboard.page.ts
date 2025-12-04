import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonMenuButton, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { AttendanceService } from 'src/app/services/attendance.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { HospitalService } from 'src/app/services/hospital.service';
import { UserService } from 'src/app/services/user.service';
import { ModalController, ToastController, AlertController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HospitalModalPage } from '../hospital-modal/hospital-modal.page';
import { SidebarComponent } from 'src/app/shared/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { Hospital } from 'src/app/models/hospital';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [BaseChartDirective, IonBackButton, IonButtons, IonContent, IonTitle, IonToolbar, IonHeader, CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel, SidebarComponent, RouterOutlet, IonMenuButton]
})
export class AdminDashboardPage implements OnInit {
  admin: any;
  hospitals: Hospital[] = [];
  totalHospitals = 0;
  totalStaff = 0;
  clockedInCount = 0;
  today = '';
  shiftCounts = { morning: 0, night: 0, off: 0 };

  // Charts
  doughnutData: ChartData<'doughnut'> | undefined;
  doughnutOptions: ChartOptions<'doughnut'> | undefined;
  clockedInChartData: ChartData<'doughnut'> | undefined;
  clockedInChartOptions: ChartOptions<'doughnut'> | undefined;
  staffPerHospitalData: ChartData<'bar'> | undefined;
  staffPerHospitalOptions: ChartOptions<'bar'> | undefined;
  attendanceTrendData: ChartData<'line'> | undefined;
  attendanceTrendOptions: ChartOptions<'line'> | undefined;

  constructor(
    private auth: AuthService,
    private hospitalService: HospitalService,
    private userService: UserService,
    private attendance: AttendanceService,
    private planner: ShiftPlannerService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { }

  async ngOnInit() {
    this.admin = this.auth.currentUser();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.today = `${yyyy}-${mm}-${dd}`;

    // Load hospitals
    this.hospitals = await firstValueFrom(this.hospitalService.getAll());
    this.totalHospitals = this.hospitals.length;

    // Total staff per hospital
    const staffPerHospital = await Promise.all(this.hospitals.map(h => this.getUsersForHospital(h.id)));
    this.totalStaff = staffPerHospital.reduce((acc, users) => acc + users.length, 0);

    // Attendance today
    const allRecords = await firstValueFrom(this.attendance.getAllRecords$());
    const todaysIn = allRecords.filter(r => r.status === 'IN' && r.timestamp.startsWith(this.today));
    this.clockedInCount = new Set(todaysIn.map(r => r.userId)).size;

    // Clocked-in chart
    const notClockedIn = this.totalStaff - this.clockedInCount;
    this.clockedInChartData = {
      labels: ['Clocked In', 'Not Clocked In'],
      datasets: [{ data: [this.clockedInCount, notClockedIn], backgroundColor: ['#10b981', '#ef4444'], borderColor: ['#065f46', '#b91c1c'], borderWidth: 1 }]
    };
    this.clockedInChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

    // Shift distribution today
    const month = Number(mm);
    const assignments = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId!, yyyy, month));
    const todayAssigns = assignments.filter(a => a.date === this.today);
    this.shiftCounts = { morning: 0, night: 0, off: 0 };
    todayAssigns.forEach(a => {
      if (a.shift === 'morning') this.shiftCounts.morning++;
      else if (a.shift === 'night') this.shiftCounts.night++;
      else this.shiftCounts.off++;
    });

    this.doughnutData = {
      labels: ['Morning', 'Night', 'Off'],
      datasets: [{ data: [this.shiftCounts.morning, this.shiftCounts.night, this.shiftCounts.off], backgroundColor: ['#3b82f6', '#111827', '#d1d5db'], borderColor: ['#2563eb', '#000', '#9ca3af'], borderWidth: 1 }]
    };
    this.doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

    // Staff per hospital chart
    this.staffPerHospitalData = {
      labels: this.hospitals.map(h => h.name),
      datasets: [{ label: 'Staff Count', data: staffPerHospital.map(u => u.length), backgroundColor: '#3b82f6', borderColor: '#2563eb', borderWidth: 1 }]
    };
    this.staffPerHospitalOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

    // Attendance trend last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const dailyCounts = last7Days.map(day => {
      const todays = allRecords.filter(r => r.timestamp.startsWith(day) && r.status === 'IN');
      return new Set(todays.map(r => r.userId)).size;
    });
    this.attendanceTrendData = {
      labels: last7Days,
      datasets: [{ label: 'Clocked In Users', data: dailyCounts, fill: false, borderColor: '#3b82f6', tension: 0.1 }]
    };
    this.attendanceTrendOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  }

  // Helper: get users per hospital
  async getUsersForHospital(hospitalId: string | number) {
    const allUsers = await firstValueFrom(this.userService.list$());
    return allUsers.filter(u => u.hospitalId === hospitalId);
  }

  // --- CRUD with HospitalService ---
  async createHospital() {
    const modal = await this.modalCtrl.create({ component: HospitalModalPage, componentProps: { hospital: null } });
    await modal.present();
    const res = await modal.onDidDismiss();
    const data = res?.data?.hospital;
    if (!data?.name) return;
    try {
      await firstValueFrom(this.hospitalService.create(data));
      this.hospitals = await firstValueFrom(this.hospitalService.getAll());
      const t = await this.toastCtrl.create({ message: 'Hospital created', duration: 1500 }); await t.present();
    } catch {
      const t = await this.toastCtrl.create({ message: 'Failed to create hospital', duration: 2000 }); await t.present();
    }
  }

  async editHospital(h: Hospital) {
    const modal = await this.modalCtrl.create({ component: HospitalModalPage, componentProps: { hospital: h } });
    await modal.present();
    const res = await modal.onDidDismiss();
    const data = res?.data?.hospital;
    if (!data?.name) return;
    try {
      await firstValueFrom(this.hospitalService.update(h.id, data));
      this.hospitals = await firstValueFrom(this.hospitalService.getAll());
      const t = await this.toastCtrl.create({ message: 'Hospital updated', duration: 1500 }); await t.present();
    } catch {
      const t = await this.toastCtrl.create({ message: 'Failed to update hospital', duration: 2000 }); await t.present();
    }
  }

  async deleteHospital(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete hospital?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete', handler: async () => {
            try {
              await firstValueFrom(this.hospitalService.delete(id));
              this.hospitals = await firstValueFrom(this.hospitalService.getAll());
              const t = await this.toastCtrl.create({ message: 'Hospital deleted', duration: 1500 }); await t.present();
            } catch {
              const t = await this.toastCtrl.create({ message: 'Failed to delete hospital', duration: 2000 }); await t.present();
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}
