import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let initPromise: Promise<void> | null = null;

// Initialize email transporter
async function initializeTransporter() {
    if (transporter) return;

    if (initPromise) {
        await initPromise;
        return;
    }

    initPromise = (async () => {
        try {
            // Check if Gmail credentials are configured
            const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
            const emailPort = parseInt(process.env.EMAIL_PORT || '587');
            const emailUser = process.env.EMAIL_USER;
            const emailPassword = process.env.EMAIL_PASSWORD;

            if (!emailUser || !emailPassword) {
                console.warn('⚠️  Email credentials not configured. Using Ethereal Email for development.');
                // Fallback to Ethereal for development
                const testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log('📧 Email service initialized (Ethereal Email for development)');
                console.log(`   Preview emails at: https://ethereal.email`);
            } else {
                // Use Gmail SMTP for production
                const isSecure = emailPort === 465;
                console.log(`📧 Configuring Email: Host=${emailHost} Port=${emailPort} Secure=${isSecure} User=${emailUser}`);

                transporter = nodemailer.createTransport({
                    host: emailHost,
                    port: emailPort,
                    secure: isSecure, // true for 465, false for other ports
                    auth: {
                        user: emailUser,
                        pass: emailPassword,
                    },
                    logger: true, // Log to console
                    debug: true,  // Include debug info
                });
                console.log('📧 Email service initialized (Gmail SMTP)');
                console.log(`   Sending from: ${emailUser}`);
            }
        } catch (error) {
            console.error('Failed to initialize email service:', error);
            throw error;
        }
    })();

    await initPromise;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
    await initializeTransporter();

    if (!transporter) {
        throw new Error('Email transporter not initialized');
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const verificationUrl = `${baseUrl}/verify/${token}`;


    const mailOptions = {
        from: '"TripSplit" <noreply@tripsplit.com>',
        to: email,
        subject: 'Verify your email address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to TripSplit, ${name}!</h2>
                <p>Thank you for signing up. Please verify your email address to get started.</p>
                <p>Click the button below to verify your email:</p>
                <a href="${verificationUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                    Verify Email
                </a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Verification email sent to:', email);
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
        console.log('   Verification link:', verificationUrl);
        return info;
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw error;
    }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    await initializeTransporter();

    if (!transporter) {
        throw new Error('Email transporter not initialized');
    }

    const resetUrl = `http://localhost:5174/reset-password/${token}`;

    const mailOptions = {
        from: '"TripSplit" <noreply@tripsplit.com>',
        to: email,
        subject: 'Reset your password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                    Reset Password
                </a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                    This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Password reset email sent to:', email);
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw error;
    }
}
