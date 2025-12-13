import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonMenuButton, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { AttendanceService } from 'src/app/services/attendance.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { MockDataService } from 'src/app/services/mock-data.service';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';
import { Hospital } from 'src/app/models/hospital';
import { IonIcon, AlertController, ToastController, ModalController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { UserService } from 'src/app/services/user.service';
import { HospitalModalPage } from '../hospital-modal/hospital-modal.page';
import { SidebarComponent } from "src/app/shared/sidebar/sidebar.component";
import { RouterOutlet } from "@angular/router";
import { HospitalService } from 'src/app/services/hospital.service';
import { add, addCircle, calendar, home, list, people, qrCode, timer, today } from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [BaseChartDirective, IonBackButton, IonButtons, IonContent, IonTitle, IonToolbar, IonHeader, CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel, SidebarComponent, RouterOutlet, IonMenuButton, IonIcon]
})
export class AdminDashboardPage implements OnInit {
  admin: any;
  totalStaff = 0;
  clockedInCount = 0;
  totalHospitals = 0;
  shiftCounts: { morning: number; night: number; off: number } = { morning: 0, night: 0, off: 0 };
  today = '';
  hospitals: any[] = [];
  todayUsers: any;
  doughnutData: ChartData<'doughnut'> | undefined;
  doughnutOptions: ChartOptions<'doughnut'> | undefined;
  clockedInChartData: ChartData<'doughnut'> | undefined;
  clockedInChartOptions: ChartOptions<'doughnut'> | undefined;
  staffPerHospitalData: ChartData<'bar'> | undefined;
  staffPerHospitalOptions: ChartOptions<'bar'> | undefined;
  attendanceTrendData: ChartData<'line'> | undefined;
  attendanceTrendOptions: ChartOptions<'line'> | undefined;

  //ionicons
  calendar = calendar;
  home = home;
  timer = timer;
  shift = today;
  people = people;
  qrcode = qrCode;
  list = list;
  addCircle = addCircle;


  constructor(
    private auth: AuthService,
    private attendance: AttendanceService,
    private planner: ShiftPlannerService,
    private mockData: MockDataService,
    private api: ApiService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private userService: UserService,
    private modalCtrl: ModalController,
    private hospitalService: HospitalService,
  ) { }

  async ngOnInit() {



    this.admin = this.auth.currentUser();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    this.today = `${yyyy}-${mm}-${dd}`;

    // Load hospitals (for general admin) and compute staff counts
    if (environment.useMock) {
      this.hospitals = this.mockData.getHospitals();

    } else {
      try {
        const res = await this.api.getHospitals().toPromise();
        this.hospitals = res || [];
      } catch (e) {
        this.hospitals = [];
      }
    }

    // Users/staff count
    if (environment.useMock) {
      const users = await firstValueFrom(this.userService.getUsers$(this.admin.hospitalId!));
      this.totalStaff = users.length;
    } else {
      // estimate via assignments if no direct users endpoint
      const month = Number(mm);
      try {
        const assignments = (await this.api.getAssignments(this.admin.hospitalId!, yyyy, month).toPromise()) || [];
        const uniqueUsers = new Set(assignments.map((a: any) => a.userId));
        this.totalStaff = uniqueUsers.size;
      } catch (e) {
        this.totalStaff = 0;
      }
    }

    // attendance: compute clocked-in count for this hospital today
    const allRecords = await firstValueFrom(this.attendance.getAllRecords$());
    const todaysIn = allRecords.filter((r: any) => r.hospitalId === this.admin.hospitalId && r.status === 'IN' && r.timestamp.startsWith(this.today));
    const uniqueClockedIn = new Set(todaysIn.map((r: any) => r.userId));
    this.clockedInCount = uniqueClockedIn.size;

    //Doughnut chart for clocked-in vs not-clocked-in
    const notClockedIn = this.totalStaff - this.clockedInCount;

    this.clockedInChartData = {
      labels: ['Clocked In', 'Not Clocked In'],
      datasets: [
        {
          data: [this.clockedInCount, notClockedIn],
          backgroundColor: ['#10b981', '#ef4444'], // green/red
          borderColor: ['#065f46', '#b91c1c'],
          borderWidth: 1
        }
      ]
    };

    this.clockedInChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    };




    const tHospitals = new Set(this.hospitals.map((h: Hospital) => h.id));
    this.totalHospitals = tHospitals.size;
    console.log('total Hospitals', this.totalHospitals);

    //testing clocked in users for the day
    const clockedUsers = todaysIn.find((id) => id.userId);
    const clockedUserId = clockedUsers?.userId;
    this.todayUsers = this.mockData.getUserById(clockedUserId);
    console.log('today attendance: ', clockedUsers);
    console.log('today users: ', this.todayUsers);

    const totalHospitals = this.mockData.getTotalHospitals(this.hospitals);
    console.log('total Hospitals 2:', totalHospitals);


    // shift distribution
    const monthNum = Number(mm);
    const assignments = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId!, yyyy, monthNum));
    const todayAssigns = assignments.filter(a => a.date === this.today);
    this.shiftCounts = { morning: 0, night: 0, off: 0 };
    todayAssigns.forEach(a => {
      if (a.shift === 'morning') this.shiftCounts.morning++;
      else if (a.shift === 'night') this.shiftCounts.night++;
      else this.shiftCounts.off++;
    });

    // prepare chart data for ng2-charts
    this.doughnutData = {
      labels: ['Morning', 'Night', 'Off'],
      datasets: [
        {
          data: [this.shiftCounts.morning, this.shiftCounts.night, this.shiftCounts.off],
          backgroundColor: ['#3b82f6', '#111827', '#d1d5db'],
          borderColor: ['#2563eb', '#000', '#9ca3af'],
          borderWidth: 1
        }
      ]
    };

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    };

    const hospitalNames = this.hospitals.map(h => h.name);
    const staffCounts = this.hospitals.map(h => this.getUsersForHospital(h.id).length);

    this.staffPerHospitalData = {
      labels: hospitalNames,
      datasets: [
        {
          label: 'Staff Count',
          data: staffCounts,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1
        }
      ]
    };

    this.staffPerHospitalOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    };


    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const dailyCounts = last7Days.map(day => {
      const todays = allRecords.filter(r => r.hospitalId === this.admin.hospitalId && r.timestamp.startsWith(day) && r.status === 'IN');
      return new Set(todays.map(r => r.userId)).size;
    });

    this.attendanceTrendData = {
      labels: last7Days,
      datasets: [
        {
          label: 'Clocked In Users',
          data: dailyCounts,
          fill: false,
          borderColor: '#3b82f6',
          tension: 0.1
        }
      ]
    };

    this.attendanceTrendOptions = {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    };


  }

  getUsersForHospital(hospitalId: number) {
    return this.mockData.getUsers().filter((u: any) => u.hospitalId === hospitalId);
  }

  // --- Hospital CRUD (simple UI helpers) ---
  async createHospital() {
    const modal = await this.modalCtrl.create({
      component: HospitalModalPage,
      componentProps: { hospital: null }
    });
    await modal.present();
    const res = await modal.onDidDismiss();
    const data = res?.data?.hospital;
    if (!data) return;
    // Validation
    if (!data.name) {
      const t = await this.toastCtrl.create({ message: 'Name is required', duration: 2000 });
      await t.present();
      return;
    }
    if (environment.useMock) {
      const newHosp: Hospital = {
        id: `hosp-${Math.floor(Math.random() * 1000) + 200}`,
        name: data.name,
        contact: data.contact || '',
        address: data.address || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any;
      this.mockData.addHospital(newHosp);
      this.hospitals = this.mockData.getHospitals();
      this.totalHospitals = this.mockData.getHospitals().length;
      console.log('new lenght: ', this.totalHospitals)
      const t = await this.toastCtrl.create({ message: 'Hospital created', duration: 1500 });
      await t.present();
    } else {
      try {
        await this.api.createHospital(data as any).toPromise();
        const refreshed = await this.api.getHospitals().toPromise();
        this.hospitals = refreshed || [];
        const t = await this.toastCtrl.create({ message: 'Hospital created', duration: 1500 });
        await t.present();
      } catch (e) {
        const t = await this.toastCtrl.create({ message: 'Failed to create hospital', duration: 2000 });
        await t.present();
      }
    }
  }

  async deleteHospital(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete hospital?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: async () => {
            if (environment.useMock) {
              this.mockData.deleteHospital(id);
              this.hospitals = this.mockData.getHospitals();
              const t = await this.toastCtrl.create({ message: 'Hospital deleted', duration: 1500 });
              await t.present();
            } else {
              try {
                await this.api.deleteHospital(id).toPromise();
                const refreshed2 = await this.api.getHospitals().toPromise();
                this.hospitals = refreshed2 || [];
                const t = await this.toastCtrl.create({ message: 'Hospital deleted', duration: 1500 });
                await t.present();
              } catch (e) {
                const t = await this.toastCtrl.create({ message: 'Failed to delete hospital', duration: 2000 });
                await t.present();
              }
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async editHospital(h: Hospital) {
    const modal = await this.modalCtrl.create({
      component: HospitalModalPage,
      componentProps: { hospital: h }
    });
    await modal.present();
    const res = await modal.onDidDismiss();
    const data = res?.data?.hospital;
    if (!data) return;
    if (!data.name) {
      const t = await this.toastCtrl.create({ message: 'Name is required', duration: 2000 });
      await t.present();
      return;
    }
    if (environment.useMock) {
      this.mockData.updateHospital(h.id, { name: data.name, contact: data.contact, address: data.address });
      this.hospitals = this.mockData.getHospitals();
      const t = await this.toastCtrl.create({ message: 'Hospital updated', duration: 1500 });
      await t.present();
    } else {
      try {
        await this.api.updateHospital(h.id, data as any).toPromise();
        const refreshed = await this.api.getHospitals().toPromise();
        this.hospitals = refreshed || [];
        const t = await this.toastCtrl.create({ message: 'Hospital updated', duration: 1500 });
        await t.present();
      } catch (e) {
        const t = await this.toastCtrl.create({ message: 'Failed to update hospital', duration: 2000 });
        await t.present();
      }
    }
  }
}
