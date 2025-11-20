// export interface Roster {
//     date: string; // yyyy-mm-dd
//     userId: number;
//     shift: 'morning' | 'night';
// }


export interface Roster {
    id: string; // uuid
    userId: number;
    hospitalId: number;
    date: string; // YYYY-MM-DD
    shift: 'morning' | 'night' | 'off';
    manuallyAssigned: boolean; // true if admin changed it
}
