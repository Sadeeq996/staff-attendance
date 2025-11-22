import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNote, IonLabel, IonItem, IonList, IonButton, IonButtons, IonCard, IonCardHeader, IonCardContent, IonCardTitle } from '@ionic/angular/standalone';
import { AttendanceService } from 'src/app/services/attendance.service';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Attendance } from 'src/app/models/attendance';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonCardTitle, IonCardContent, IonCardHeader, IonCard, IonButtons, IonButton, IonItem, IonLabel, IonNote, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList]
})
export class HistoryPage implements OnInit {

  user: any;
  records: Attendance[] = [];

  constructor(
    private auth: AuthService,
    private attendance: AttendanceService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.user = this.auth.currentUser();
    if (this.user) {
      try {
        this.records = await firstValueFrom(this.attendance.getHistoryForUser$(this.user.id));
      } catch (e: any) {
        // fallback to empty
        this.records = [];
        console.error('Failed loading history', e);
      }
    }
  }

  backToDashboard() {
    this.router.navigateByUrl('/dashboard');
  }

}
