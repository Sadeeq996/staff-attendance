import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonDatetime, IonNote, IonChip, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { firstValueFrom } from 'rxjs';
import { ShiftAssignment } from 'src/app/models/shift-assignment';
import { arrowBack } from 'ionicons/icons';

@Component({
    selector: 'app-shift-records',
    templateUrl: './shift-records.page.html',
    styleUrls: ['./shift-records.page.scss'],
    standalone: true,
    imports: [IonIcon, IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonDatetime, IonNote, IonChip, CommonModule, FormsModule]
})
export class ShiftRecordsPage implements OnInit {
    period: 'daily' | 'weekly' | 'monthly' = 'daily';
    dateIso = new Date().toISOString();
    assignments: ShiftAssignment[] = [];
    groupedShifts: { shift: string; count: number; staff: any[] }[] = [];
    loading = false;
    admin: any;

    //ionicons
    arrowBack = arrowBack;

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

                this.groupAndSortShifts();
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

            this.groupAndSortShifts();
        } finally {
            this.loading = false;
        }
    }

    groupAndSortShifts() {
        // Group assignments by shift type with shift order: morning, night, off
        const shiftOrder = { 'morning': 0, 'night': 1, 'off': 2 };
        const grouped = new Map<string, any[]>();

        this.assignments.forEach(a => {
            if (!grouped.has(a.shift)) {
                grouped.set(a.shift, []);
            }
            grouped.get(a.shift)!.push(a);
        });

        // Sort by shift order and create result array
        this.groupedShifts = Array.from(grouped.entries())
            .sort((a, b) => (shiftOrder as any)[a[0]] - (shiftOrder as any)[b[0]])
            .map(([shift, staffList]) => ({
                shift,
                count: staffList.length,
                staff: staffList
            }));
    }

    onPeriodChange(ev: any) { this.period = ev.detail.value; this.load(); }
    onDateChange(ev: any) { this.dateIso = ev.detail.value; this.load(); }
}
