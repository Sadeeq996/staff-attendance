import express, { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get all shift assignments
 * GET /api/shift-assignments
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { userId, rosterId, startDate, endDate } = req.query;

        const where: any = {};

        if (userId) where.userId = userId as string;
        if (rosterId) where.rosterId = rosterId as string;

        if (startDate || endDate) {
            where.assignedDate = {};
            if (startDate) where.assignedDate.gte = new Date(startDate as string);
            if (endDate) where.assignedDate.lte = new Date(endDate as string);
        }

        const assignments = await prisma.shiftAssignment.findMany({
            where,
            include: { user: true, shift: true, roster: true },
        });

        res.status(200).json(assignments);
    } catch (error: any) {
        console.error('Get shift assignments error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get shift assignment by ID
 * GET /api/shift-assignments/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const assignment = await prisma.shiftAssignment.findUnique({
            where: { id },
            include: { user: true, shift: true, roster: true },
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Shift assignment not found' });
        }

        res.status(200).json(assignment);
    } catch (error: any) {
        console.error('Get shift assignment error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create shift assignment
 * POST /api/shift-assignments
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { userId, shiftId, rosterId, assignedDate } = req.body;

        if (!userId || !shiftId || !rosterId || !assignedDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const assignment = await prisma.shiftAssignment.create({
            data: {
                userId,
                shiftId,
                rosterId,
                assignedDate: new Date(assignedDate),
            },
            include: { user: true, shift: true, roster: true },
        });

        res.status(201).json(assignment);
    } catch (error: any) {
        console.error('Create shift assignment error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update shift assignment
 * PUT /api/shift-assignments/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { shiftId, assignedDate } = req.body;

        const assignment = await prisma.shiftAssignment.update({
            where: { id },
            data: {
                ...(shiftId && { shiftId }),
                ...(assignedDate && { assignedDate: new Date(assignedDate) }),
            },
            include: { user: true, shift: true, roster: true },
        });

        res.status(200).json(assignment);
    } catch (error: any) {
        console.error('Update shift assignment error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete shift assignment
 * DELETE /api/shift-assignments/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        await prisma.shiftAssignment.delete({ where: { id } });

        res.status(200).json({ message: 'Shift assignment deleted successfully' });
    } catch (error: any) {
        console.error('Delete shift assignment error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
