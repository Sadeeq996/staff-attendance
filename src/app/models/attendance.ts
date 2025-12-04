export interface Attendance {
    id: string; // uuid or timestamp-based id
    userId: number;
    hospitalId?: number;
    shift: 'morning' | 'night';
    status: 'IN' | 'OUT';
    timestamp: string; // ISO;
    durationMinutes?: number; // only for OUT records
    dateLocal?: string;
}


export const attendance: Attendance[] = [
    // Hospital 101 - Morning shift
    {
        id: 'att-001',
        userId: 4,
        hospitalId: 101,
        shift: 'morning',
        status: 'IN',
        timestamp: new Date('2025-11-20T08:00:00Z').toISOString(),
    },
    {
        id: 'att-002',
        userId: 4,
        hospitalId: 101,
        shift: 'morning',
        status: 'OUT',
        timestamp: new Date('2025-11-20T16:00:00Z').toISOString(),
        durationMinutes: 480,
    },
    {
        id: 'att-003',
        userId: 5,
        hospitalId: 101,
        shift: 'morning',
        status: 'IN',
        timestamp: new Date('2025-11-20T08:15:00Z').toISOString(),
    },
    {
        id: 'att-004',
        userId: 5,
        hospitalId: 101,
        shift: 'morning',
        status: 'OUT',
        timestamp: new Date('2025-11-20T16:15:00Z').toISOString(),
        durationMinutes: 480,
    },

    // Hospital 102 - Night shift
    {
        id: 'att-005',
        userId: 6,
        hospitalId: 102,
        shift: 'night',
        status: 'IN',
        timestamp: new Date('2025-11-20T20:00:00Z').toISOString(),
    },
    {
        id: 'att-006',
        userId: 6,
        hospitalId: 102,
        shift: 'night',
        status: 'OUT',
        timestamp: new Date('2025-11-21T04:00:00Z').toISOString(),
        durationMinutes: 480,
    },
    {
        id: 'att-007',
        userId: 7,
        hospitalId: 102,
        shift: 'night',
        status: 'IN',
        timestamp: new Date('2025-11-20T20:30:00Z').toISOString(),
    },
    {
        id: 'att-008',
        userId: 7,
        hospitalId: 102,
        shift: 'night',
        status: 'OUT',
        timestamp: new Date('2025-11-21T04:30:00Z').toISOString(),
        durationMinutes: 480,
    },

    // Hospital 103 - Morning shift
    {
        id: 'att-009',
        userId: 8,
        hospitalId: 103,
        shift: 'morning',
        status: 'IN',
        timestamp: new Date('2025-11-20T07:45:00Z').toISOString(),
    },
    {
        id: 'att-010',
        userId: 8,
        hospitalId: 103,
        shift: 'morning',
        status: 'OUT',
        timestamp: new Date('2025-11-20T15:45:00Z').toISOString(),
        durationMinutes: 480,
    },
    {
        id: 'att-011',
        userId: 9,
        hospitalId: 103,
        shift: 'morning',
        status: 'IN',
        timestamp: new Date('2025-11-20T07:50:00Z').toISOString(),
    },
    {
        id: 'att-012',
        userId: 9,
        hospitalId: 103,
        shift: 'morning',
        status: 'OUT',
        timestamp: new Date('2025-11-20T15:50:00Z').toISOString(),
        durationMinutes: 480,
    },
];