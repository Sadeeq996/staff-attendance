import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonFooter, IonButtons, ModalController } from '@ionic/angular/standalone';
import { Hospital } from 'src/app/models/hospital';

@Component({
    selector: 'app-hospital-modal',
    templateUrl: './hospital-modal.page.html',
    styleUrls: ['./hospital-modal.page.scss'],
    standalone: true,
    imports: [IonButtons, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonFooter, CommonModule, FormsModule]
})
export class HospitalModalPage implements OnInit {
    @Input() hospital?: Hospital | null;

    name = '';
    contact = '';
    address = '';

    constructor(private modalCtrl: ModalController) { }

    ngOnInit() {
        if (this.hospital) {
            this.name = this.hospital.name;
            this.contact = this.hospital.contact || '';
            this.address = this.hospital.address || '';
        }
    }

    save() {
        if (!this.name.trim()) {
            alert('Name is required');
            return;
        }
        // Return the form data to the caller
        const result: Partial<Hospital> = {
            name: this.name,
            contact: this.contact,
            address: this.address
        };
        this.modalCtrl.dismiss({ hospital: result });
    }

    cancel() {
        this.modalCtrl.dismiss();
    }
}
