import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { LoginPage } from '../pages/auth/login/login.page';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonButton, IonInput, IonItem, IonLabel, FormsModule, CommonModule, IonHeader, IonToolbar, IonTitle, IonContent,],
})
export class Tab1Page {
  email = 'staff@attendance.com';
  password = 'password';
  error = '';

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
  }

  async submit() {
    this.error = '';
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigateByUrl('/dashboard');
    } catch (err: any) {
      this.error = err?.toString() || 'Login failed';
    }
  }

}


