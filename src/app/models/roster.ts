

export interface Roster {
    id: string; // uuid
    userId: number;
    hospitalId: string;
    date: string; // YYYY-MM-DD
    shift: 'morning' | 'night' | 'off';
    manuallyAssigned: boolean; // true if admin changed it
}



// export const roster: Roster[] = [
//     // USER 1 - hospital 1
//     {
//         id: 'a1f9b5c0-11a1-4a1e-bb11-001000000001',
//         userId: 1,
//         hospitalId: "hosp-101",
//         date: '2025-01-01',
//         shift: 'morning',
//         manuallyAssigned: false
//     },
//     {
//         id: 'a1f9b5c0-11a1-4a1e-bb11-001000000002',
//         userId: 1,
//         hospitalId: "hosp-101",
//         date: '2025-01-02',
//         shift: 'night',
//         manuallyAssigned: false
//     },
//     {
//         id: 'a1f9b5c0-11a1-4a1e-bb11-001000000003',
//         userId: 1,
//         hospitalId: "hosp-101",
//         date: '2025-01-03',
//         shift: 'off',
//         manuallyAssigned: true
//     },

//     // USER 2 - hospital 1
//     {
//         id: 'b2f9b5c0-22a2-4b2e-cc22-002000000001',
//         userId: 2,
//         hospitalId: "hosp-101",
//         date: '2025-01-01',
//         shift: 'off',
//         manuallyAssigned: false
//     },
//     {
//         id: 'b2f9b5c0-22a2-4b2e-cc22-002000000002',
//         userId: 2,
//         hospitalId: "hosp-101",
//         date: '2025-01-02',
//         shift: 'morning',
//         manuallyAssigned: false
//     },
//     {
//         id: 'b2f9b5c0-22a2-4b2e-cc22-002000000003',
//         userId: 2,
//         hospitalId: "hosp-101",
//         date: '2025-01-03',
//         shift: 'night',
//         manuallyAssigned: true
//     },

//     // USER 3 - hospital 2
//     {
//         id: 'c3f9b5c0-33a3-4c3e-dd33-003000000001',
//         userId: 3,
//         hospitalId: "hosp-102",
//         date: '2025-01-01',
//         shift: 'night',
//         manuallyAssigned: false
//     },
//     {
//         id: 'c3f9b5c0-33a3-4c3e-dd33-003000000002',
//         userId: 3,
//         hospitalId: "hosp-102",
//         date: '2025-01-02',
//         shift: 'night',
//         manuallyAssigned: false
//     },
//     {
//         id: 'c3f9b5c0-33a3-4c3e-dd33-003000000003',
//         userId: 3,
//         hospitalId: "hosp-102",
//         date: '2025-01-03',
//         shift: 'off',
//         manuallyAssigned: false
//     },

//     // USER 4 - hospital 2
//     {
//         id: 'd4f9b5c0-44a4-4d4e-ee44-004000000001',
//         userId: 4,
//         hospitalId: "hosp-102",
//         date: '2025-01-01',
//         shift: 'morning',
//         manuallyAssigned: true
//     },
//     {
//         id: 'd4f9b5c0-44a4-4d4e-ee44-004000000002',
//         userId: 4,
//         hospitalId: "hosp-102",
//         date: '2025-01-02',
//         shift: 'morning',
//         manuallyAssigned: false
//     },
//     {
//         id: 'd4f9b5c0-44a4-4d4e-ee44-004000000003',
//         userId: 4,
//         hospitalId: "hosp-102",
//         date: '2025-01-03',
//         shift: 'night',
//         manuallyAssigned: false
//     }
// ];


import { v4 as uuidv4 } from 'uuid';

const today = new Date();

function formatDate(d: Date) {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function addDays(d: Date, days: number) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
}

// Sample shifts for demo
const shifts: ('morning' | 'night' | 'off')[] = ['morning', 'night', 'off', 'morning', 'off'];

export const roster: Roster[] = [
    // USER 1 - hospital 1
    ...[0, 1, 2].map(i => ({
        id: uuidv4(),
        userId: 1,
        hospitalId: 'hosp-101',
        date: formatDate(addDays(today, i)),
        shift: shifts[i % shifts.length],
        manuallyAssigned: i === 2
    })),

    // USER 2 - hospital 1
    ...[0, 1, 2].map(i => ({
        id: uuidv4(),
        userId: 2,
        hospitalId: 'hosp-101',
        date: formatDate(addDays(today, i)),
        shift: shifts[(i + 1) % shifts.length],
        manuallyAssigned: i === 2
    })),

    // USER 3 - hospital 2
    ...[0, 1, 2].map(i => ({
        id: uuidv4(),
        userId: 3,
        hospitalId: 'hosp-102',
        date: formatDate(addDays(today, i)),
        shift: shifts[(i + 2) % shifts.length],
        manuallyAssigned: false
    })),

    // USER 4 - hospital 2
    ...[0, 1, 2].map(i => ({
        id: uuidv4(),
        userId: 4,
        hospitalId: 'hosp-101',
        date: formatDate(addDays(today, i)),
        shift: shifts[(i + 3) % shifts.length],
        manuallyAssigned: i === 0
    }))
];
