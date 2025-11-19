import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNote, IonLabel, IonItem, IonList, IonButton, IonButtons } from '@ionic/angular/standalone';
import { AttendanceService } from 'src/app/services/attendance.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonList, IonItem, IonLabel, IonNote, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HistoryPage implements OnInit {

  records: any[] = [];

  constructor(private auth: AuthService, private attendance: AttendanceService) { }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.records = this.attendance.getHistoryForUser(user.id);
    }
  }

}
