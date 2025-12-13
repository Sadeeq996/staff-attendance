import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, IonItem, IonLabel, MenuController, IonList, IonContent, IonTitle, IonToolbar, IonHeader, IonMenu, IonButton, IonTabButton, IonButtons, IonMenuButton, IonToggle, IonImg, IonAvatar, IonCard } from "@ionic/angular/standalone";
import { homeOutline, cubeOutline, peopleOutline, pricetagOutline, settingsOutline, closeOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { map } from 'rxjs';
import { User } from 'src/app/models/user';
import { LoginPage } from '../../pages/auth/login/login.page';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [IonCard, IonToggle, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonLabel, IonItem, IonIcon, IonMenu],
})
export class SidebarComponent implements OnInit {
  // icons used in template
  readonly homeIcon = homeOutline;
  readonly dashboardIcon = cubeOutline;
  readonly usersIcon = peopleOutline;
  readonly settingsIcon = settingsOutline;
  close = closeOutline;

  user!: User | null;

  constructor(private menuCtrl: MenuController,
    private router: Router,
    private auth: AuthService,
  ) { }

  openMenu() {
    this.menuCtrl.open();
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  toggleMenu() {
    this.menuCtrl.toggle();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logOut() {
    this.auth.logout();
    this.router.navigateByUrl('/login')
  }

  async ngOnInit() {
    this.user = await this.auth.currentUser();
    console.log('avatar: ', this.user)
  }

}
