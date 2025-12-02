import express, { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get all hospitals
 * GET /api/hospitals
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const hospitals = await prisma.hospital.findMany();
        res.status(200).json(hospitals);
    } catch (error: any) {
        console.error('Get hospitals error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get hospital by ID
 * GET /api/hospitals/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const hospital = await prisma.hospital.findUnique({
            where: { id },
            include: { users: true, shifts: true },
        });

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.status(200).json(hospital);
    } catch (error: any) {
        console.error('Get hospital error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create hospital
 * POST /api/hospitals
 */
router.post('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
    try {
        const { name, address, phone, email } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Hospital name is required' });
        }

        const hospital = await prisma.hospital.create({
            data: { name, address, phone, email },
        });

        res.status(201).json(hospital);
    } catch (error: any) {
        console.error('Create hospital error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update hospital
 * PUT /api/hospitals/:id
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email } = req.body;

        const hospital = await prisma.hospital.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(address && { address }),
                ...(phone && { phone }),
                ...(email && { email }),
            },
        });

        res.status(200).json(hospital);
    } catch (error: any) {
        console.error('Update hospital error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete hospital
 * DELETE /api/hospitals/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        await prisma.hospital.delete({ where: { id } });

        res.status(200).json({ message: 'Hospital deleted successfully' });
    } catch (error: any) {
        console.error('Delete hospital error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
