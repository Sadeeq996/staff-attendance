import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonFooter } from '@ionic/angular/standalone';
import { Hospital } from 'src/app/models/hospital';

@Component({
    selector: 'app-hospital-modal',
    templateUrl: './hospital-modal.page.html',
    styleUrls: ['./hospital-modal.page.scss'],
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonFooter, CommonModule, FormsModule]
})
export class HospitalModalPage {
    @Input() hospital?: Hospital | null;

    name = '';
    contact = '';
    address = '';

    constructor() { }

    ngOnInit() {
        if (this.hospital) {
            this.name = this.hospital.name;
            this.contact = this.hospital.contact || '';
            this.address = this.hospital.address || '';
        }
    }
}
