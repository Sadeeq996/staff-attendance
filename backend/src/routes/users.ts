import express, { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get all users
 * GET /api/users
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                hospitalId: true,
                hospital: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        email: true,
                    },
                },
                createdAt: true,
            },
        }); res.status(200).json(users);
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                hospitalId: true,
                hospital: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        email: true,
                    },
                },
                createdAt: true,
            },
        }); if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update user
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, role, hospitalId } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(fullName && { fullName }),
                ...(email && { email }),
                ...(role && { role }),
                ...(hospitalId && { hospitalId }),
            },
            include: { hospital: true },
        });

        res.status(200).json(user);
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({ where: { id } });

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
