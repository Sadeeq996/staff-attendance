import express, { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get all rosters
 * GET /api/rosters
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { hospitalId } = req.query;

        const rosters = await prisma.roster.findMany({
            where: hospitalId ? { hospitalId: hospitalId as string } : {},
            include: { hospital: true, shift: true, assignments: true },
        });

        res.status(200).json(rosters);
    } catch (error: any) {
        console.error('Get rosters error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get roster by ID
 * GET /api/rosters/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const roster = await prisma.roster.findUnique({
            where: { id },
            include: { hospital: true, shift: true, assignments: true },
        });

        if (!roster) {
            return res.status(404).json({ error: 'Roster not found' });
        }

        res.status(200).json(roster);
    } catch (error: any) {
        console.error('Get roster error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create roster
 * POST /api/rosters
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { name, startDate, endDate, hospitalId, shiftId } = req.body;

        if (!name || !startDate || !endDate || !hospitalId || !shiftId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const roster = await prisma.roster.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                hospitalId,
                shiftId,
            },
        });

        res.status(201).json(roster);
    } catch (error: any) {
        console.error('Create roster error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update roster
 * PUT /api/rosters/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate } = req.body;

        const roster = await prisma.roster.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
            },
        });

        res.status(200).json(roster);
    } catch (error: any) {
        console.error('Update roster error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete roster
 * DELETE /api/rosters/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        await prisma.roster.delete({ where: { id } });

        res.status(200).json({ message: 'Roster deleted successfully' });
    } catch (error: any) {
        console.error('Delete roster error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
