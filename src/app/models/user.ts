export interface User {
    id: number;
    email: string;
    fullName: string;
    role: 'staff' | 'hospital_admin' | 'general_admin';
    hospitalId?: number;
}

