import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { generateCustomerId } from '../utils/customerIdGenerator.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 10;
// Password validation helper
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
    }
    return { valid: true };
}
export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
    }
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Generate customer ID
        const customerId = await generateCustomerId(name || email);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
                provider: 'local',
                emailVerified: false,
                verificationToken,
                verificationTokenExpiry,
                customerId,
            },
        });
        // Send verification email (don't fail signup if email fails)
        try {
            await sendVerificationEmail(email, user.name || 'User', verificationToken);
            console.log(`✅ Verification email sent to: ${email}`);
        }
        catch (emailError) {
            console.error('⚠️  Failed to send verification email:', emailError);
            console.log(`📧 Verification link (use this to verify manually):`);
            console.log(`   http://localhost:5174/verify/${verificationToken}`);
        }
        res.json({
            message: 'Signup successful! Please check your email to verify your account.',
            email: user.email,
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Email not verified',
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                needsVerification: true
            });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const verifyEmail = async (req, res) => {
    const { token } = req.params;
    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }
    try {
        // Find user with this verification token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: {
                    gte: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        // Update user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });
        res.json({ message: 'Email verified successfully! You can now log in.' });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const resendVerification = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiry,
            },
        });
        // Send verification email
        await sendVerificationEmail(email, user.name || 'User', verificationToken);
        res.json({ message: 'Verification email sent! Please check your inbox.' });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                customerId: true,
                email: true,
                name: true,
                avatar: true,
                dateOfBirth: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateProfile = async (req, res) => {
    const { name, dateOfBirth } = req.body;
    try {
        const updateData = {};
        if (name !== undefined) {
            updateData.name = name;
        }
        if (dateOfBirth !== undefined) {
            updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: updateData,
            select: {
                id: true,
                customerId: true,
                email: true,
                name: true,
                avatar: true,
                dateOfBirth: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=auth.controller.js.map