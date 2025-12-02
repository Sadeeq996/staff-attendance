import express, { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get attendance records
 * GET /api/attendance
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId, startDate, endDate, status } = req.query;

        const where: any = {};

        if (userId) where.userId = userId as string;
        if (status) where.status = status as string;

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const records = await prisma.attendanceRecord.findMany({
            where,
            include: { user: true },
        });

        res.status(200).json(records);
    } catch (error: any) {
        console.error('Get attendance records error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Clock in
 * POST /api/attendance/clock-in
 */
router.post('/clock-in', authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existingRecord = await prisma.attendanceRecord.findFirst({
            where: {
                userId: req.user.userId,
                date: today,
                clockOutTime: null,
            },
        });

        if (existingRecord) {
            return res.status(409).json({ error: 'Already clocked in' });
        }

        const record = await prisma.attendanceRecord.create({
            data: {
                userId: req.user.userId,
                clockInTime: new Date(),
                date: today,
                status: 'PRESENT',
            },
        });

        res.status(201).json(record);
    } catch (error: any) {
        console.error('Clock in error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Clock out
 * POST /api/attendance/clock-out
 */
router.post('/clock-out', authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                userId: req.user.userId,
                date: today,
                clockOutTime: null,
            },
        });

        if (!record) {
            return res.status(404).json({ error: 'No active clock-in found' });
        }

        const updated = await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: { clockOutTime: new Date() },
        });

        res.status(200).json(updated);
    } catch (error: any) {
        console.error('Clock out error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current clock-in status
 * GET /api/attendance/status
 */
router.get('/status', authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                userId: req.user.userId,
                date: today,
            },
        });

        res.status(200).json({
            isClockedIn: record && !record.clockOutTime,
            clockInTime: record?.clockInTime,
            clockOutTime: record?.clockOutTime,
        });
    } catch (error: any) {
        console.error('Get status error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
