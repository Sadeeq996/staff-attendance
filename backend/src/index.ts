import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma'; // Import the shared Prisma client

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import hospitalRoutes from './routes/hospitals';
import shiftRoutes from './routes/shifts';
import rosterRoutes from './routes/rosters';
import shiftAssignmentRoutes from './routes/shift-assignments';
import attendanceRoutes from './routes/attendance';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/shift-assignments', shiftAssignmentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
const startServer = async () => {
    try {
        await prisma.$connect(); // Connect using shared Prisma client
        console.log('✓ Database connected');

        app.listen(port, () => {
            console.log(`✓ Server running on http://localhost:${port}`);
            console.log(`✓ API Health: http://localhost:${port}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();
export { prisma };

