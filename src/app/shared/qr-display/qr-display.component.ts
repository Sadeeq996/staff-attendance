import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { Observable } from 'rxjs';
import { QrCodeService } from 'src/app/services/qr-code-service';
import { IonCard, IonCardTitle, IonCardContent, IonCardHeader } from "@ionic/angular/standalone";

@Component({
  selector: 'app-qr-display',
  templateUrl: './qr-display.component.html',
  styleUrls: ['./qr-display.component.scss'],
  standalone: true,
  imports: [IonCardHeader, IonCardContent, IonCardTitle, IonCard, CommonModule, QRCodeComponent],
})
export class QrDisplayComponent implements OnInit {

  qrValue$?: Observable<string | null>;
  constructor(private qrDataService: QrCodeService) {
    this.qrValue$ = this.qrDataService.qrCodeValue$;
  }



  ngOnInit() { }

}
