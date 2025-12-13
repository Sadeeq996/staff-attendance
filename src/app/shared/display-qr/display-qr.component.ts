import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { QrCodeService } from 'src/app/services/qr-code-service';
import { QRCodeComponent } from 'angularx-qrcode';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardTitle, IonCardContent, IonCardHeader, IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-display-qr',
  templateUrl: './display-qr.component.html',
  styleUrls: ['./display-qr.component.scss'],
  imports: [IonCardHeader, IonCardContent, IonCardTitle, IonCard, CommonModule, QRCodeComponent],

})
export class DisplayQrComponent implements OnInit {

  qrValue$?: Observable<string | null>;
  constructor(private qrDataService: QrCodeService) {
    this.qrValue$ = this.qrDataService.qrCodeValue$;
  }
  ngOnInit() { }

}
