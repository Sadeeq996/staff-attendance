import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, ModalController, IonAvatar, IonImg } from '@ionic/angular/standalone';
import { ProfileEditModal } from './profile-edit.modal';
import { UserService } from 'src/app/services/user.service';
import { AuditService } from 'src/app/services/audit.service';
import { AuthService } from 'src/app/services/auth.service';
import { MockDataService } from 'src/app/services/mock-data.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonImg, IonAvatar, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  user!: any;
  userHospital: any;
  avatar = 'assets/icon.png';

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private mock: MockDataService,
    private userService: UserService,
    private audit: AuditService,
    private auth: AuthService
  ) { }

  async ngOnInit() {
    this.user = this.auth.currentUser();
    this.userHospital = this.mock.getHospitalById(this.user.hospitalId!);
    console.log('user Hospital: ', this.userHospital)
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
