export type ShiftType = 'morning' | 'night' | 'off';

export interface ShiftAssignment {
    id: string;
    userId: number;
    hospitalId: string;
    date: string; // YYYY-MM-DD
    shift: ShiftType;
    manuallyAssigned: boolean;
    dateLocal?: string; // optional normalized date for local date matching
}
