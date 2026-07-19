import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// A transporter is only built when mail settings are present. Without them the
// app still works: codes are printed to the server console instead of emailed,
// so the verification flow is testable without real mail credentials.
//
// Two ways to configure, checked in order:
//   1. GMAIL_USER + GMAIL_APP_PASSWORD  — Gmail shortcut, no host/port needed
//   2. SMTP_HOST + SMTP_USER + SMTP_PASS — any other provider
let transporter = null;
let mailFrom = null;

// Gmail shows app passwords in groups of four; the spaces are display-only.
const gmailUser = process.env.GMAIL_USER?.trim();
const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass }
    });
    mailFrom = process.env.SMTP_FROM || `"Forensic Medical Department" <${gmailUser}>`;
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    mailFrom = process.env.SMTP_FROM || `"Forensic Medical Department" <${process.env.SMTP_USER}>`;
}

export const isMailConfigured = () => transporter !== null;

function buildHtml(name, code, minutes, intro, outro) {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="margin: 0 0 4px;">Forensic Medical Department</h2>
      <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Medico-Legal Records Management System</p>
      <p>Hello ${name || "there"},</p>
      <p>${intro}</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                  background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
        ${code}
      </div>
      <p style="font-size: 14px; color: #64748b;">
        This code expires in ${minutes} minutes. ${outro}
      </p>
    </div>`;
}

/**
 * Send a verification code to a user.
 * Falls back to a console log when SMTP is not configured so that local and
 * CI environments never fail on a missing mail server.
 */
export async function sendVerificationEmail(email, name, code, minutes) {
    if (!transporter) {
        console.log(`[DEV] Verification code for ${email}: ${code} (expires in ${minutes} minutes)`);
        return { delivered: false };
    }

    await transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: "Verify your email address",
        text: `Your verification code is ${code}. It expires in ${minutes} minutes.`,
        html: buildHtml(
            name, code, minutes,
            "Use the verification code below to confirm your email address and activate your account.",
            "If you did not try to sign in, you can ignore this email."
        )
    });

    return { delivered: true };
}

/** Send a password reset code. Same console fallback as verification. */
export async function sendPasswordResetEmail(email, name, code, minutes) {
    if (!transporter) {
        console.log(`[DEV] Password reset code for ${email}: ${code} (expires in ${minutes} minutes)`);
        return { delivered: false };
    }

    await transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: "Reset your password",
        text: `Your password reset code is ${code}. It expires in ${minutes} minutes.`,
        html: buildHtml(
            name, code, minutes,
            "We received a request to reset your password. Use the code below to choose a new one.",
            "If you did not request a password reset, you can ignore this email — your password will not change."
        )
    });

    return { delivered: true };
}
