import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { ModalController, ToastController } from '@ionic/angular';
import { ProfileEditModal } from './profile-edit.modal';
import { UserService } from 'src/app/services/user.service';
import { AuditService } from 'src/app/services/audit.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  user: any;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private userService: UserService,
    private audit: AuditService,
    private auth: AuthService
  ) { }

  async ngOnInit() {
    this.user = this.auth.currentUser();
  }

  async openEditProfile() {
    const modal = await this.modalCtrl.create({
      component: ProfileEditModal,
      componentProps: { user: this.user }
    });
    await modal.present();
    const res = await modal.onDidDismiss();
    if (res?.data?.user) {
      // update local view
      this.user = res.data.user;
      // already audited in modal, but keep a light toast as confirmation
      const t = await this.toastCtrl.create({ message: 'Profile updated', duration: 1400 });
      await t.present();
    }
  }

}
