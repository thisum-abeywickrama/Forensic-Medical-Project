import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import UserModel from "../models/UserModel.js";
import { sendVerificationEmail, sendPasswordResetEmail, isMailConfigured } from "../utils/mailer.js";
import dotenv from "dotenv";

dotenv.config();

const CODE_TTL_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;

// Issue the JWT + safe user payload returned on a successful sign-in
const issueSession = (user) => ({
    token: jwt.sign(
        { id: user.id, role: user.role, name: user.name },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1d" }
    ),
    user: {
        id: user.id,
        name: user.name,
        role: user.role,
        designation: user.designation,
        email: user.email,
        profilePictureUrl: user.profile_picture_url
    }
});

// Generate a fresh 6-digit code, store only its hash, and email it to the user.
// Returns the delivery outcome so callers can tell the client whether an email
// actually went out — a code that only reached the server console should not be
// reported to the user as "we've sent you an email".
const startVerification = async (user) => {
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await UserModel.setVerificationCode(user.email, codeHash, expiresAt);
    return sendVerificationEmail(user.email, user.name, code, CODE_TTL_MINUTES);
};

// Register a new user
export const registerUser = async (req, res) => {
    try {
        // Only allow admins to register new users
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { id, name, role, designation, email, phone, password, profilePictureUrl } = req.body;

        // Check if user exists
        const existingUser = await UserModel.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Generate a salt and hash the password
        // A cost factor of 10 is a good balance between security and performance
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await UserModel.createUser({
            id, name, role, designation, email, phone, passwordHash, profilePictureUrl
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// Login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Securely compare the plain-text password with the stored bcrypt hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Credentials are valid, but an unverified account cannot enter the system yet.
        // Send a fresh code and let the client redirect to the verification step.
        if (!user.email_verified) {
            const { delivered } = await startVerification(user);
            return res.status(403).json({
                message: delivered
                    ? "Please verify your email address to continue. We've sent you a verification code."
                    : "Please verify your email address to continue. The code could not be emailed — see the server console.",
                verificationRequired: true,
                emailDelivered: delivered,
                email: user.email
            });
        }

        res.status(200).json({ message: "Login successful", ...issueSession(user) });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

// Confirm an emailed verification code and sign the user in
export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: "Email and verification code are required" });
        }

        const user = await UserModel.getUserByEmail(email);

        // A single generic message for every failure mode, so this endpoint cannot be
        // used to discover which addresses exist or which are pending verification.
        const invalid = () => res.status(400).json({ message: "Invalid or expired verification code" });

        if (!user || !user.verification_code_hash || !user.verification_expires_at) {
            return invalid();
        }

        if (new Date(user.verification_expires_at).getTime() < Date.now()) {
            return res.status(400).json({ message: "This verification code has expired. Please request a new one." });
        }

        if (user.verification_attempts >= MAX_VERIFY_ATTEMPTS) {
            return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
        }

        const isMatch = await bcrypt.compare(String(code), user.verification_code_hash);
        if (!isMatch) {
            await UserModel.incrementVerificationAttempts(email);
            return invalid();
        }

        const verified = await UserModel.markEmailVerified(email);

        res.status(200).json({
            message: "Email verified successfully",
            ...issueSession(verified || user)
        });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ message: "Server error during email verification" });
    }
};

// Send a new verification code to a pending account
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await UserModel.getUserByEmail(email);

        // Always answer the same way whether or not the account exists or is
        // already verified — otherwise this becomes an account-enumeration oracle.
        // emailDelivered reports whether this server can send mail at all, which
        // is the same for every address and so reveals nothing about the account.
        const sent = () => res.status(200).json({
            message: "If that account needs verification, a new code has been sent.",
            emailDelivered: isMailConfigured()
        });

        if (!user || user.email_verified) {
            return sent();
        }

        if (user.verification_sent_at) {
            const secondsSinceLast = (Date.now() - new Date(user.verification_sent_at).getTime()) / 1000;
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.`
                });
            }
        }

        await startVerification(user);
        return sent();
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ message: "Server error while resending verification code" });
    }
};

// Step 1 of reset — email a code to a user who has forgotten their password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await UserModel.getUserByEmail(email);

        // Identical response whether or not the address is registered, so this
        // endpoint cannot be used to discover which staff emails exist.
        const sent = () => res.status(200).json({
            message: "If an account exists for that address, a reset code has been sent.",
            emailDelivered: isMailConfigured()
        });

        if (!user) {
            return sent();
        }

        if (user.reset_sent_at) {
            const secondsSinceLast = (Date.now() - new Date(user.reset_sent_at).getTime()) / 1000;
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.`
                });
            }
        }

        const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

        await UserModel.setResetCode(user.email, codeHash, expiresAt);
        await sendPasswordResetEmail(user.email, user.name, code, CODE_TTL_MINUTES);

        return sent();
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error while requesting a password reset" });
    }
};

// Step 2 of reset — verify the code and set the new password
export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: "Email, code and new password are required" });
        }

        if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
            });
        }

        const user = await UserModel.getUserByEmail(email);

        const invalid = () => res.status(400).json({ message: "Invalid or expired reset code" });

        if (!user || !user.reset_code_hash || !user.reset_expires_at) {
            return invalid();
        }

        if (new Date(user.reset_expires_at).getTime() < Date.now()) {
            return res.status(400).json({ message: "This reset code has expired. Please request a new one." });
        }

        if (user.reset_attempts >= MAX_VERIFY_ATTEMPTS) {
            return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
        }

        const isMatch = await bcrypt.compare(String(code), user.reset_code_hash);
        if (!isMatch) {
            await UserModel.incrementResetAttempts(email);
            return invalid();
        }

        const passwordHash = await bcrypt.hash(String(newPassword), 10);
        await UserModel.updatePassword(email, passwordHash);

        // No token is issued here on purpose: the user signs in again with the
        // new password, which confirms it was set to what they intended.
        res.status(200).json({ message: "Password reset successfully. You can now sign in." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error while resetting password" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        // Be careful not to expose password hashes when returning user lists
        const safeUsers = users.map(u => {
            const { password_hash, ...safeData } = u;
            return safeData;
        });

        res.status(200).json(safeUsers);
    } catch (error) {
        console.error("Fetch users error:", error);
        res.status(500).json({ message: "Server error fetching users" });
    }
};