import { Component, OnInit } from '@angular/core';
import { IonIcon, IonItem, IonLabel, MenuController, IonList, IonContent, IonTitle, IonToolbar, IonHeader, IonMenu, IonButton, IonTabButton, IonButtons, IonMenuButton } from "@ionic/angular/standalone";

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [IonButtons, IonTabButton, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonLabel, IonItem, IonIcon, IonMenu, IonMenuButton],
})
export class SidebarComponent implements OnInit {

  constructor(private menuCtrl: MenuController) { }

  openMenu() {
    this.menuCtrl.open();
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  toggleMenu() {
    this.menuCtrl.toggle();
  }
  ngOnInit() { }

}
