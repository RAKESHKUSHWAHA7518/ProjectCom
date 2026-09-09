import { Resend } from 'resend';
import logger from '../utils/logger.js';

// Initialize Resend SDK with API key or fallback to prevent module loading crash in test/dev
const resend = new Resend(process.env.EMAIL_PASS || 're_dummy_for_testing');

/**
 * Send an email verification link to the user.
 * @param {{ email: string, name: string }} user
 * @param {string} plainToken
 */
export async function sendVerificationEmail(user, plainToken) {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS.startsWith('re_dummy')) {
    logger.warn('EMAIL_PASS not configured, skipping sendVerificationEmail');
    return;
  }
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${plainToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Verify your SkillSwap email',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SkillSwap</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Verify your email address</h2>
                      <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                        Hi ${user.name || 'there'},
                      </p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                        Thanks for signing up for SkillSwap! Please verify your email address by clicking the button below.
                        This link is valid for <strong>24 hours</strong>.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#4f46e5;">
                            <a href="${verifyUrl}"
                               style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                        Or copy and paste this URL into your browser:<br />
                        <a href="${verifyUrl}" style="color:#4f46e5;word-break:break-all;">${verifyUrl}</a>
                      </p>
                      <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
                        If you did not create an account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} SkillSwap. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Resend API Error (Verification)', { error });
    } else {
      logger.info('Verification email sent successfully', { id: data.id });
    }
  } catch (err) {
    logger.error('sendVerificationEmail failed catastrophically', { email: user.email, error: err.message, stack: err.stack });
  }
}

/**
 * Send a welcome email after successful account creation / verification.
 * @param {{ email: string, name: string }} user
 */
export async function sendWelcomeEmail(user) {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS.startsWith('re_dummy')) {
    logger.warn('EMAIL_PASS not configured, skipping sendWelcomeEmail');
    return;
  }
  const frontendUrl = process.env.FRONTEND_URL;
  const profileUrl = `${frontendUrl}/profile`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to SkillSwap!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SkillSwap</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Welcome aboard, ${user.name || 'there'}! 🎉</h2>
                      <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                        We're thrilled to have you join SkillSwap — the community where people exchange skills and grow together.
                      </p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                        Start by completing your profile so others can discover the skills you have to offer and what you want to learn.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#4f46e5;">
                            <a href="${profileUrl}"
                               style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                              Complete Your Profile
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:24px 0 0;color:#4b5563;font-size:15px;line-height:1.6;">
                        You can also browse all available skills and connect with others on the
                        <a href="${frontendUrl}" style="color:#4f46e5;text-decoration:none;">SkillSwap platform</a>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} SkillSwap. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Resend API Error (Welcome)', { error });
    }
  } catch (err) {
    logger.error('sendWelcomeEmail failed catastrophically', { email: user.email, error: err.message });
  }
}

/**
 * Send a password reset link to the user.
 * @param {{ email: string, name: string }} user
 * @param {string} plainToken
 */
export async function sendPasswordResetEmail(user, plainToken) {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS.startsWith('re_dummy')) {
    logger.warn('EMAIL_PASS not configured, skipping sendPasswordResetEmail');
    return;
  }
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${plainToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Reset your SkillSwap password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SkillSwap</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Password reset request</h2>
                      <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                        Hi ${user.name || 'there'},
                      </p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                        We received a request to reset the password for your SkillSwap account. Click the button below to choose a new password.
                        This link is valid for <strong>1 hour</strong>.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#4f46e5;">
                            <a href="${resetUrl}"
                               style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                        Or copy and paste this URL into your browser:<br />
                        <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
                      </p>
                      <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
                        If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} SkillSwap. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Resend API Error (Password Reset)', { error });
    }
  } catch (err) {
    logger.error('sendPasswordResetEmail failed catastrophically', { email: user.email, error: err.message });
  }
}

/**
 * Send a confirmation email after a successful password reset.
 * @param {{ email: string, name: string }} user
 */
export async function sendPasswordResetConfirmEmail(user) {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS.startsWith('re_dummy')) {
    logger.warn('EMAIL_PASS not configured, skipping sendPasswordResetConfirmEmail');
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your SkillSwap password has been changed',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SkillSwap</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Password changed successfully</h2>
                      <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                        Hi ${user.name || 'there'},
                      </p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                        This is a confirmation that the password for your SkillSwap account associated with
                        <strong>${user.email}</strong> has been successfully changed.
                      </p>
                      <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                        If you did not make this change, please contact our support team immediately as your account may have been compromised.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#4f46e5;">
                            <a href="${process.env.FRONTEND_URL}"
                               style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">
                              Go to SkillSwap
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} SkillSwap. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Resend API Error (Password Reset Confirm)', { error });
    }
  } catch (err) {
    logger.error('sendPasswordResetConfirmEmail failed catastrophically', { email: user.email, error: err.message });
  }
}
