import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, IonItem, IonLabel, MenuController, IonList, IonContent, IonTitle, IonToolbar, IonHeader, IonMenu, IonButton, IonTabButton, IonButtons, IonMenuButton, IonToggle, IonImg, IonAvatar, IonCard } from "@ionic/angular/standalone";
import { homeOutline, cubeOutline, peopleOutline, pricetagOutline, settingsOutline } from 'ionicons/icons';

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
  readonly tagIcon = pricetagOutline;
  readonly settingsIcon = settingsOutline;

  constructor(private menuCtrl: MenuController, private router: Router) { }

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

  ngOnInit() { }

}
