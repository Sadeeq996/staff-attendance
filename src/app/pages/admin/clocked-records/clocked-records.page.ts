import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonNote, IonDatetime, IonButton } from '@ionic/angular/standalone';
import { AttendanceService } from 'src/app/services/attendance.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-clocked-records',
    templateUrl: './clocked-records.page.html',
    styleUrls: ['./clocked-records.page.scss'],
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonNote, IonDatetime, CommonModule, FormsModule]
})
export class ClockedRecordsPage implements OnInit {
    period: 'daily' | 'weekly' | 'monthly' = 'daily';
    dateIso = new Date().toISOString();
    records: any[] = [];
    loading = false;
    admin: any;

    constructor(private attendance: AttendanceService, private auth: AuthService, private userService: UserService) { }

    async ngOnInit() {
        this.admin = this.auth.currentUser();
        await this.load();
    }

    async load() {
        this.loading = true;
        try {
            const all = await firstValueFrom(this.attendance.getAllRecords$());
            const hospitalId = this.admin?.hospitalId;
            const targetDate = new Date(this.dateIso);

            let start: Date, end: Date;
            if (this.period === 'daily') {
                start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
                end = new Date(start.getTime());
                end.setDate(end.getDate() + 1);
            } else if (this.period === 'weekly') {
                const day = targetDate.getDay();
                start = new Date(targetDate);
                start.setDate(start.getDate() - day);
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 7);
            } else {
                start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
            }

            const filtered = all.filter(r => r.hospitalId === hospitalId && new Date(r.timestamp) >= start && new Date(r.timestamp) < end);
            // fetch user map to enrich records with names
            // const users = await firstValueFrom(this.userService.getUsers$(hospitalId));

            const allUsers = await firstValueFrom(this.userService.list$());
            const users = allUsers.filter(u => u.hospitalId === hospitalId);
            const userMap = new Map<number, any>(users.map(u => [u.id, u] as [number, any]));
            const enriched = filtered.map(r => ({ ...r, userFullName: userMap.get(r.userId)?.fullName || String(r.userId) }));
            // sort by timestamp desc
            this.records = enriched.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
        } finally {
            this.loading = false;
        }
    }

    onPeriodChange(ev: any) {
        this.period = ev.detail.value;
        this.load();
    }

    onDateChange(ev: any) {
        this.dateIso = ev.detail.value;
        this.load();
    }
}
