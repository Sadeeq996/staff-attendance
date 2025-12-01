import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/models/user';
import { MockDataService } from 'src/app/services/mock-data.service';

@Component({
    selector: 'app-user-modal',
    templateUrl: './user-modal.page.html',
    styleUrls: ['./user-modal.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule]
})
export class UserModalPage {
    @Input() mode: 'create' | 'edit' = 'create';
    @Input() user?: User;

    // local copy used for editing
    model: Partial<User> = {};
    hospitals: any[] = [];

    constructor(private modalCtrl: ModalController, private mock: MockDataService) { }

    ngOnInit() {
        if (this.user) this.model = { ...this.user };

        this.hospitals = this.mock.getHospitals();
        console.log('hospitals in mock: ', this.hospitals);
    }

    save() {
        // basic validation
        if (!this.model.email || !this.model.fullName || !this.model.role) {
            alert('Please provide email, full name and role');
            return;
        }
        // hospitalId must be present for hospital_admin and staff
        if ((this.model.role === 'hospital_admin' || this.model.role === 'staff') && !this.model.hospitalId) {
            alert('Please select a hospital for hospital admin / staff');
            return;
        }
        this.modalCtrl.dismiss({ user: this.model });
    }

    cancel() {
        this.modalCtrl.dismiss();
    }
}
