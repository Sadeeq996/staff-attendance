import express, { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get all shifts
 * GET /api/shifts
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { hospitalId } = req.query;

        const shifts = await prisma.shift.findMany({
            where: hospitalId ? { hospitalId: hospitalId as string } : {},
            include: { hospital: true },
        });

        res.status(200).json(shifts);
    } catch (error: any) {
        console.error('Get shifts error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get shift by ID
 * GET /api/shifts/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const shift = await prisma.shift.findUnique({
            where: { id },
            include: { hospital: true, assignments: true },
        });

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.status(200).json(shift);
    } catch (error: any) {
        console.error('Get shift error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create shift
 * POST /api/shifts
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { name, startTime, endTime, hospitalId } = req.body;

        if (!name || !startTime || !endTime || !hospitalId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const shift = await prisma.shift.create({
            data: { name, startTime, endTime, hospitalId },
        });

        res.status(201).json(shift);
    } catch (error: any) {
        console.error('Create shift error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update shift
 * PUT /api/shifts/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime } = req.body;

        const shift = await prisma.shift.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
            },
        });

        res.status(200).json(shift);
    } catch (error: any) {
        console.error('Update shift error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete shift
 * DELETE /api/shifts/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        await prisma.shift.delete({ where: { id } });

        res.status(200).json({ message: 'Shift deleted successfully' });
    } catch (error: any) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
