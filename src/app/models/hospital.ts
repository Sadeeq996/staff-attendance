export interface Hospital {
    id: string; // uuid or timestamp-based id
    name: string;
    address?: string;
    contact: string;
    created_at: string; // ISO
    updated_at: string; // ISO
}


export const hospitals: Hospital[] = [
    {
        id: 'hosp-101',
        name: 'City Hospital',
        address: '123 Main St, Cityville',
        contact: '+1234567890',
        created_at: new Date('2023-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2023-01-01T08:00:00Z').toISOString(),
    },
    {
        id: 'hosp-102',
        name: 'Green Valley Hospital',
        address: '456 Green Rd, Valleytown',
        contact: '+1987654321',
        created_at: new Date('2023-02-01T08:00:00Z').toISOString(),
        updated_at: new Date('2023-02-01T08:00:00Z').toISOString(),
    },
    {
        id: 'hosp-103',
        name: 'Sunrise Medical Center',
        address: '789 Sunrise Ave, Sunny City',
        contact: '+1122334455',
        created_at: new Date('2023-03-01T08:00:00Z').toISOString(),
        updated_at: new Date('2023-03-01T08:00:00Z').toISOString(),
    },
];

// Mock attendance records
