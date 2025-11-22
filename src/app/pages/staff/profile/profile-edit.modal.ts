import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonButtons } from '@ionic/angular/standalone';
import { ModalController, ToastController } from '@ionic/angular';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { AuditService } from 'src/app/services/audit.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-profile-edit-modal',
    templateUrl: './profile-edit.modal.html',
    styleUrls: ['./profile-edit.modal.scss'],
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonButtons, CommonModule, FormsModule]
})
export class ProfileEditModal {
    @Input() user!: User;

    form: Partial<User> = {};
    saving = false;

    constructor(
        private modalCtrl: ModalController,
        private toastCtrl: ToastController,
        private userService: UserService,
        private audit: AuditService
    ) { }

    ionViewWillEnter() {
        // copy initial values
        // this.form = { fullName: this.user.fullName, email: this.user.email, phone: (this.user as any).phone };
        this.form = { fullName: this.user.fullName, email: this.user.email };

    }

    dismiss(data?: any) {
        this.modalCtrl.dismiss(data);
    }

    async save() {
        if (!this.user) return;
        this.saving = true;
        const before = { ...this.user };
        try {
            const update: Partial<User> = {};
            if (this.form.fullName !== undefined) update.fullName = this.form.fullName as string;
            if (this.form.email !== undefined) update.email = this.form.email as string;
            if ((this.form as any).phone !== undefined) (update as any).phone = (this.form as any).phone;

            const res = await firstValueFrom(this.userService.update$(this.user.id, update));
            if (!res) throw new Error('Failed to update profile');

            // audit the change
            this.audit.log({ actorId: res.id, action: 'update-profile', resourceType: 'user', resourceId: res.id, before, after: res });

            const t = await this.toastCtrl.create({ message: 'Profile updated', duration: 1500 });
            await t.present();
            this.dismiss({ user: res });
        } catch (e: any) {
            const t = await this.toastCtrl.create({ message: e?.message || 'Failed to update', duration: 2500, color: 'danger' });
            await t.present();
        } finally {
            this.saving = false;
        }
    }
}
