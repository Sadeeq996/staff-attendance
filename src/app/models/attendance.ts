export interface Attendance {
    id: string; // uuid or timestamp-based id
    userId: number;
    hospitalId?: number;
    shift: 'morning' | 'night';
    status: 'IN' | 'OUT';
    timestamp: string; // ISO
}
