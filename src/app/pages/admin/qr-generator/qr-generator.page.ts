import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { QrCodeService } from 'src/app/services/qr-code-service';
import { User } from 'src/app/models/user';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { DisplayQrComponent } from "src/app/shared/display-qr/display-qr.component";
import { arrowBackSharp, qrCode } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-generator',
  templateUrl: './qr-generator.page.html',
  styleUrls: ['./qr-generator.page.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButtons, IonButton, IonLabel, IonItem, IonCol, IonRow, IonGrid, IonContent, IonTitle, IonToolbar, IonHeader, DisplayQrComponent]
})
export class QrGeneratorPage implements OnInit, OnDestroy {

  currentUser: User | null = null;
  userSub: Subscription = new Subscription();

  attendanceToken = signal<string | null>(null);
  // timeLeft = signal<number>(300);
  // intervalSub: Subscription = new Subscription();

  //ionicons
  qrCode = qrCode;
  arrowBack = arrowBackSharp;

  constructor(
    private authService: AuthService,
    private qrService: QrCodeService
  ) { }

  ngOnInit() {
    this.userSub = this.authService.currentUser$().subscribe(user => {
      this.currentUser = user;

      if (user) {
        // Load existing or generate new token
        const token = this.qrService.getToken(user.id.toString(), user.hospitalId!);
        this.attendanceToken.set(token);
        // this.timeLeft.set(300);
      }

      // Start countdown timer
      // this.startTimer();
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    // this.intervalSub.unsubscribe();
  }

  // startTimer() {
  //   this.intervalSub = interval(1000).subscribe(() => {
  //     if (this.timeLeft() > 0) {
  //       this.timeLeft.set(this.timeLeft() - 1);
  //     }
  //   });
  // }

  // Manual button click
  regenerateQr() {
    if (!this.currentUser) return;
    const token = this.qrService.regenerateToken(this.currentUser.id.toString(), this.currentUser.hospitalId!);
    this.attendanceToken.set(token);
    // this.timeLeft.set(300);
  }
}
