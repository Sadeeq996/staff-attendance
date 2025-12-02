

import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient, Prisma } from '@prisma/client'
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient({
    log: [
        { emit: 'stdout', level: 'query' },      // Logs all queries
        { emit: 'stdout', level: 'info' },       // Info messages
        { emit: 'stdout', level: 'warn' },       // Warnings
        { emit: 'stdout', level: 'error' }       // Errors
    ],
    // Optional: override default pool configuration
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});


// Optional: log query events programmatically
// prisma.$on('query', (e: Prisma.QueryEvent) => {
//     console.log(`Query: ${e.query} | Duration: ${e.duration}ms`);
// });


