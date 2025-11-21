import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton, IonInput } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonButton, IonInput, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

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
