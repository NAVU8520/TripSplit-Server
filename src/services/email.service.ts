import { Resend } from 'resend';

let resend: Resend | null = null;

// Initialize Resend client
function initializeResend() {
    if (resend) return resend;

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn('⚠️  RESEND_API_KEY not configured. Email sending will fail.');
        throw new Error('RESEND_API_KEY environment variable is required');
    }

    resend = new Resend(apiKey);
    console.log('📧 Email service initialized (Resend)');

    return resend;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
    const client = initializeResend();
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const verificationUrl = `${baseUrl}/verify/${token}`;
    const fromEmail = process.env.EMAIL_FROM || 'TripSplit <onboarding@resend.dev>';

    try {
        const { data, error } = await client.emails.send({
            from: fromEmail,
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
        });

        if (error) {
            console.error('Failed to send verification email:', error);
            throw error;
        }

        console.log('📧 Verification email sent to:', email);
        console.log('   Email ID:', data?.id);
        console.log('   Verification link:', verificationUrl);
        return data;
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw error;
    }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    const client = initializeResend();
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    const fromEmail = process.env.EMAIL_FROM || 'TripSplit <onboarding@resend.dev>';

    try {
        const { data, error } = await client.emails.send({
            from: fromEmail,
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
        });

        if (error) {
            console.error('Failed to send password reset email:', error);
            throw error;
        }

        console.log('📧 Password reset email sent to:', email);
        console.log('   Email ID:', data?.id);
        return data;
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw error;
    }
}
