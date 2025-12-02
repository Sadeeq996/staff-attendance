import express, { Router } from 'express';
import { prisma } from '../prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authenticate, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', async (req: AuthRequest, res) => {
    try {
        const { email, fullName, password, hospitalId, role } = req.body;

        if (!email || !fullName || !password || !hospitalId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                fullName,
                password: hashedPassword,
                hospitalId,
                role: role || 'STAFF',
            },
        });

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            token,
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', async (req: AuthRequest, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { hospital: true },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                hospital: user.hospital,
            },
            token,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { hospital: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error: any) {
        console.error('Profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
