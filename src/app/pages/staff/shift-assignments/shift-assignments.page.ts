import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonNote, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { ShiftPlannerService } from 'src/app/services/shift-planner-service';
import { firstValueFrom } from 'rxjs';
import { ShiftAssignment } from 'src/app/models/shift-assignment';

@Component({
    selector: 'app-shift-assignments',
    templateUrl: './shift-assignments.page.html',
    styleUrls: ['./shift-assignments.page.scss'],
    standalone: true,
    imports: [IonSpinner, IonBackButton, IonButtons, IonNote, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, CommonModule, FormsModule]
})
export class ShiftAssignmentsPage implements OnInit {
    user: any;
    year!: number;
    month!: number;
    monthName = '';
    assignments: ShiftAssignment[] = [];
    loading = false;
    daysInMonth: number[] = [];

    // Calendar grid structure: map of date string -> shift
    calendarGrid: Map<string, { shift: string; day: number }> = new Map();

    constructor(private auth: AuthService, private planner: ShiftPlannerService) { }

    async ngOnInit() {
        this.user = this.auth.currentUser();
        const now = new Date();
        this.setMonthTo(now.getFullYear(), now.getMonth() + 1);
        await this.loadAssignments();
    }

    setMonthTo(y: number, m: number) {
        this.year = y;
        this.month = m;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        this.monthName = monthNames[m - 1];
        const days = new Date(this.year, this.month, 0).getDate();
        this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
        this.buildCalendarGrid();
    }

    buildCalendarGrid() {
        this.calendarGrid.clear();
        for (const a of this.assignments) {
            this.calendarGrid.set(a.date, { shift: a.shift, day: parseInt(a.date.split('-')[2]) });
        }
    }

    async loadAssignments() {
        this.loading = true;
        try {
            this.assignments = await firstValueFrom(
                this.planner.getMonthAssignments$(this.user.hospitalId, this.year, this.month)
            );
            // Filter to only current user's assignments
            this.assignments = this.assignments.filter(a => a.userId === this.user.id);
            this.buildCalendarGrid();
        } catch (e) {
            console.error('Failed to load assignments', e);
            this.assignments = [];
        } finally {
            this.loading = false;
        }
    }

    async prevMonth() {
        let m = this.month - 1, y = this.year;
        if (m < 1) { m = 12; y -= 1; }
        this.setMonthTo(y, m);
        await this.loadAssignments();
    }

    async nextMonth() {
        let m = this.month + 1, y = this.year;
        if (m > 12) { m = 1; y += 1; }
        this.setMonthTo(y, m);
        await this.loadAssignments();
    }

    getShift(day: number): string {
        const dateStr = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.calendarGrid.get(dateStr)?.shift || 'off';
    }

    getShiftColor(shift: string): string {
        switch (shift) {
            case 'morning': return '#3b82f6';     // blue
            case 'night': return '#1f2937';       // dark gray
            case 'off': return '#d1d5db';         // light gray
            default: return '#e5e7eb';
        }
    }

    getShiftLabel(shift: string): string {
        switch (shift) {
            case 'morning': return 'M';
            case 'night': return 'N';
            case 'off': return 'OFF';
            default: return '-';
        }
    }

    getGridColumn(day: number): string {
        if (day === 1) {
            const firstDayOfWeek = new Date(this.year, this.month - 1, 1).getDay();
            return String(firstDayOfWeek + 1);
        }
        return 'auto';
    }
}
