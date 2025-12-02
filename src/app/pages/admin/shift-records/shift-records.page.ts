import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonDatetime, IonNote } from '@ionic/angular/standalone';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { firstValueFrom } from 'rxjs';
import { ShiftAssignment } from 'src/app/models/shift-assignment';

@Component({
    selector: 'app-shift-records',
    templateUrl: './shift-records.page.html',
    styleUrls: ['./shift-records.page.scss'],
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonDatetime, IonNote, CommonModule, FormsModule]
})
export class ShiftRecordsPage implements OnInit {
    period: 'daily' | 'weekly' | 'monthly' = 'daily';
    dateIso = new Date().toISOString();
    assignments: ShiftAssignment[] = [];
    loading = false;
    admin: any;

    constructor(private planner: ShiftPlannerService, private auth: AuthService, private userService: UserService) { }

    async ngOnInit() {
        this.admin = this.auth.currentUser();
        await this.load();
    }

    async load() {
        this.loading = true;
        try {
            const target = new Date(this.dateIso);
            const yyyy = target.getFullYear();
            const mm = target.getMonth() + 1;
            // For simplicity, fetch whole month and then filter for weekly/daily
            const all = await firstValueFrom(this.planner.getMonthAssignments$(this.admin.hospitalId!, yyyy, mm));

            // fetch users to enrich assignments
            const users = await firstValueFrom(this.userService.getUsers$(this.admin.hospitalId));
            const userMap = new Map<number, any>(users.map(u => [u.id, u] as [number, any]));

            if (this.period === 'monthly') {
                this.assignments = all.map(a => ({ ...a, userFullName: userMap.get(a.userId)?.fullName || String(a.userId) })).sort((a, b) => a.date.localeCompare(b.date));
                return;
            }

            // compute start/end as in ClockedRecords
            let start: Date, end: Date;
            if (this.period === 'daily') {
                start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
                end = new Date(start); end.setDate(end.getDate() + 1);
            } else {
                const day = target.getDay();
                start = new Date(target); start.setDate(start.getDate() - day); start.setHours(0, 0, 0, 0);
                end = new Date(start); end.setDate(end.getDate() + 7);
            }

            this.assignments = all.filter(a => {
                const d = new Date(a.date + 'T00:00:00');
                return d >= start && d < end;
            }).map(a => ({ ...a, userFullName: userMap.get(a.userId)?.fullName || String(a.userId) })).sort((a, b) => a.date.localeCompare(b.date));
        } finally {
            this.loading = false;
        }
    }

    onPeriodChange(ev: any) { this.period = ev.detail.value; this.load(); }
    onDateChange(ev: any) { this.dateIso = ev.detail.value; this.load(); }
}
