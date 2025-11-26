export interface User {
    id: number;
    email: string;
    fullName: string;
    role: 'staff' | 'hospital_admin' | 'general_admin';
    hospitalId?: number;
}





export const users: User[] = [
    // General Admins
    {
        id: 1,
        email: 'superadmin@attendance.com',
        fullName: 'Super Admin',
        role: 'general_admin',
    },

    // Hospital Admins
    {
        id: 2,
        email: 'admin1@hospital1.com',
        fullName: 'Alice Johnson',
        role: 'hospital_admin',
        hospitalId: 101,
    },
    {
        id: 3,
        email: 'admin2@hospital2.com',
        fullName: 'Bob Smith',
        role: 'hospital_admin',
        hospitalId: 102,
    },

    // Staff / Employees for Hospital 1
    {
        id: 4,
        email: 'staff@hospital1.com',
        fullName: 'Abu Sule',
        role: 'staff',
        hospitalId: 101,
    },
    {
        id: 5,
        email: 'staff2@hospital1.com',
        fullName: 'Ali Manu',
        role: 'staff',
        hospitalId: 101,
    },

    // Staff / Employees for Hospital 2
    {
        id: 6,
        email: 'staff@hospital2.com',
        fullName: 'Bello Isah',
        role: 'staff',
        hospitalId: 102,
    },
    {
        id: 7,
        email: 'staff2@hospital2.com',
        fullName: 'Binta Ado',
        role: 'staff',
        hospitalId: 102,
    },

    // Staff / Employees for Hospital 3 (no admin yet)
    {
        id: 8,
        email: 'staff1@hospital3.com',
        fullName: 'Sani Idi',
        role: 'staff',
        hospitalId: 103,
    },
    {
        id: 9,
        email: 'staff2@hospital3.com',
        fullName: 'Fati Ahmad',
        role: 'staff',
        hospitalId: 103,
    },
];
