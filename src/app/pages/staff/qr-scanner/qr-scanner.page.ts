import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonToast } from '@ionic/angular/standalone';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QrCodeService } from 'src/app/services/qr-code-service';
import { AuthService } from 'src/app/services/auth.service';
import { attendance } from '../../../models/attendance';
import { AttendanceService } from 'src/app/services/attendance.service';
import { Router } from '@angular/router';
import { ShiftType } from 'src/app/models/shift-assignment';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.page.html',
  styleUrls: ['./qr-scanner.page.scss'],
  standalone: true,
  imports: [IonToast, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ZXingScannerModule]
})
export class QrScannerPage implements OnInit {

  lastScannedToken: string = '';
  scanStatus: string = '';
  isSuccess: boolean = false;




  user: any;
  toastMessage: string | null = null;
  toastColor: 'success' | 'danger' = 'success';
  assignedShift: ShiftType | null = null;
  today: string = '';

  constructor(private qrDataService: QrCodeService,
    private auth: AuthService,
    private attendance: AttendanceService,
    private qrService: QrCodeService,
    private router: Router,
    private planner: ShiftPlannerService,
  ) { }
  ngOnInit(): void {
    this.user = this.auth.currentUser();
    console.log('user: ', this.user)
    this.getToday();

    const assign = this.planner.getAssignmentFor(this.user.id, this.user.hospitalId!, this.today);
    console.log('Today assignment:', assign);
    this.assignedShift = assign ? assign.shift : null;
  }

  getToday() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;
    const dd = now.getDate();
    this.today = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }

  onCodeResult(resultString: string) {
    if (resultString && resultString !== this.lastScannedToken) {
      this.lastScannedToken = resultString;

      // *** This is where the backend integration happens ***
      // Instead of comparing locally, you send this token to your API:
      this.recordAttendance(resultString);
    }
  }

  // onCodeResult(resultString: string) {
  //   if (!resultString) return;

  //   const scanner = this.authService.currentUser(); // or from BehaviorSubject
  //   if (!scanner) {
  //     this.fail("Not logged in.");
  //     return;
  //   }

  //   const validation = this.qrDataService.validateToken(
  //     resultString,
  //     scanner.hospitalId
  //   );

  //   if (!validation.valid) {
  //     this.fail(validation.message);
  //     return;
  //   }

  //   // If valid → record attendance
  //   this.recordAttendance(scanner.id, validation.payload!);
  // }


  recordAttendance(token: string) {
    // 1. Get current staff ID (from login/local storage)
    const staffId = 'STAFF123'; // Replace with actual dynamic staff ID

    // 2. Make an HTTP POST request to your backend API
    // The backend verifies if the 'token' is currently valid/active.
    console.log(`Sending token ${token} and Staff ID ${staffId} to the API...`);

    // Example of what happens after a successful API call:
    this.isSuccess = true;
    this.scanStatus = `Attendance recorded successfully for ${staffId} with token: ${token}`;

    // Example of what happens if the API call fails (e.g. invalid/expired token):
    // this.isSuccess = false;
    // this.scanStatus = "Error: Invalid or expired QR code.";



  }


  async onScanSuccess(token: string) {
    const validation = this.qrService.validateToken(token, this.user.hospitalId!);

    if (!validation.valid) {
      this.showToast(validation.message, 'danger');
      return;
    }

    try {
      const rec = await this.attendance.clockIn$(this.user.id, this.user.hospitalId, this.assignedShift as any).toPromise();
      this.showToast('Clock In recorded', 'success');
      // After short delay, navigate back to dashboard
      setTimeout(() => this.router.navigate(['/dashboard']), 1000);
    } catch (err: any) {
      this.showToast(err?.message || 'Failed to clock in', 'danger');
    }
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }

  private showToast(msg: string, color: 'success' | 'danger' = 'success') {
    this.toastMessage = msg;
    this.toastColor = color;
  }

}
