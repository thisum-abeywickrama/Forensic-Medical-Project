import request from "supertest";
import app from "../app.js";
import UserModel from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from "@jest/globals";

// Set environment variables for testing
process.env.JWT_SECRET_KEY = "test-secret-key-for-jest";

describe("Auth Controller & Routes", () => {
    let hashedPassword;
    let getUserByEmailSpy;
    let createUserSpy;
    let getAllUsersSpy;
    let setVerificationCodeSpy;
    let markEmailVerifiedSpy;
    let incrementVerificationAttemptsSpy;
    let setResetCodeSpy;
    let updatePasswordSpy;
    let incrementResetAttemptsSpy;

    beforeAll(async () => {
        // Create a real hash for the test password
        hashedPassword = await bcrypt.hash("password123", 10);
    });

    beforeEach(() => {
        // Spy on static methods to mock database operations dynamically in ES Modules
        getUserByEmailSpy = jest.spyOn(UserModel, "getUserByEmail");
        createUserSpy = jest.spyOn(UserModel, "createUser");
        getAllUsersSpy = jest.spyOn(UserModel, "getAllUsers");
        setVerificationCodeSpy = jest.spyOn(UserModel, "setVerificationCode").mockResolvedValue(undefined);
        markEmailVerifiedSpy = jest.spyOn(UserModel, "markEmailVerified");
        incrementVerificationAttemptsSpy = jest.spyOn(UserModel, "incrementVerificationAttempts").mockResolvedValue(1);
        setResetCodeSpy = jest.spyOn(UserModel, "setResetCode").mockResolvedValue(undefined);
        updatePasswordSpy = jest.spyOn(UserModel, "updatePassword").mockResolvedValue({ id: "USR-2000" });
        incrementResetAttemptsSpy = jest.spyOn(UserModel, "incrementResetAttempts").mockResolvedValue(1);
        // Keep the dev-mode verification code out of the test output
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore original methods after each test to prevent test cross-contamination
        jest.restoreAllMocks();
    });

    describe("POST /api/auth/login", () => {
        test("1. Should login successfully with correct credentials", async () => {
            const mockUser = {
                id: "USR-1000",
                name: "Dr. Perera",
                role: "admin",
                designation: "Consultant",
                email: "dr.perera@forensic.gov",
                password_hash: hashedPassword,
                profile_picture_url: null,
                email_verified: true
            };

            getUserByEmailSpy.mockResolvedValue(mockUser);

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "dr.perera@forensic.gov",
                    password: "password123"
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
            expect(response.body.user).toEqual({
                id: "USR-1000",
                name: "Dr. Perera",
                role: "admin",
                designation: "Consultant",
                email: "dr.perera@forensic.gov",
                profilePictureUrl: null
            });
            expect(getUserByEmailSpy).toHaveBeenCalledWith("dr.perera@forensic.gov");
        });

        test("2. Should fail to login with incorrect password", async () => {
            const mockUser = {
                id: "USR-1000",
                email: "dr.perera@forensic.gov",
                password_hash: hashedPassword
            };

            getUserByEmailSpy.mockResolvedValue(mockUser);

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "dr.perera@forensic.gov",
                    password: "wrongpassword"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid email or password");
        });

        test("3. Should fail to login if user is not found in database", async () => {
            // Mock returning undefined (no user found)
            getUserByEmailSpy.mockResolvedValue(undefined);

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "nonexistent@forensic.gov",
                    password: "password123"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid email or password");
        });

        test("4. Should fail to login when email or password is missing", async () => {
            getUserByEmailSpy.mockResolvedValue(undefined);

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: ""
                    // password omitted
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid email or password");
        });
    });

    describe("Email verification gate", () => {
        const futureDate = () => new Date(Date.now() + 10 * 60 * 1000);

        const unverifiedUser = (overrides = {}) => ({
            id: "USR-2000",
            name: "Dr. Silva",
            role: "doctor",
            designation: "Medical Officer",
            email: "dr.silva@forensic.gov",
            password_hash: hashedPassword,
            profile_picture_url: null,
            email_verified: false,
            verification_attempts: 0,
            ...overrides
        });

        test("11. Should block login for an unverified account and send a code", async () => {
            getUserByEmailSpy.mockResolvedValue(unverifiedUser());

            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "dr.silva@forensic.gov", password: "password123" });

            expect(response.status).toBe(403);
            expect(response.body.verificationRequired).toBe(true);
            expect(response.body.email).toBe("dr.silva@forensic.gov");
            expect(response.body).not.toHaveProperty("token");
            expect(setVerificationCodeSpy).toHaveBeenCalled();
        });

        test("12. Should verify a correct code and issue a token", async () => {
            const codeHash = await bcrypt.hash("123456", 10);
            getUserByEmailSpy.mockResolvedValue(unverifiedUser({
                verification_code_hash: codeHash,
                verification_expires_at: futureDate()
            }));
            markEmailVerifiedSpy.mockResolvedValue({
                id: "USR-2000",
                name: "Dr. Silva",
                role: "doctor",
                designation: "Medical Officer",
                email: "dr.silva@forensic.gov",
                profile_picture_url: null
            });

            const response = await request(app)
                .post("/api/auth/verify-email")
                .send({ email: "dr.silva@forensic.gov", code: "123456" });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
            expect(response.body.user.email).toBe("dr.silva@forensic.gov");
            expect(markEmailVerifiedSpy).toHaveBeenCalledWith("dr.silva@forensic.gov");
        });

        test("13. Should reject an incorrect code and count the attempt", async () => {
            const codeHash = await bcrypt.hash("123456", 10);
            getUserByEmailSpy.mockResolvedValue(unverifiedUser({
                verification_code_hash: codeHash,
                verification_expires_at: futureDate()
            }));

            const response = await request(app)
                .post("/api/auth/verify-email")
                .send({ email: "dr.silva@forensic.gov", code: "999999" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid or expired verification code");
            expect(response.body).not.toHaveProperty("token");
            expect(incrementVerificationAttemptsSpy).toHaveBeenCalledWith("dr.silva@forensic.gov");
            expect(markEmailVerifiedSpy).not.toHaveBeenCalled();
        });

        test("14. Should reject an expired code", async () => {
            const codeHash = await bcrypt.hash("123456", 10);
            getUserByEmailSpy.mockResolvedValue(unverifiedUser({
                verification_code_hash: codeHash,
                verification_expires_at: new Date(Date.now() - 60 * 1000)
            }));

            const response = await request(app)
                .post("/api/auth/verify-email")
                .send({ email: "dr.silva@forensic.gov", code: "123456" });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/expired/i);
            expect(markEmailVerifiedSpy).not.toHaveBeenCalled();
        });

        test("15. Should lock out after too many incorrect attempts", async () => {
            const codeHash = await bcrypt.hash("123456", 10);
            getUserByEmailSpy.mockResolvedValue(unverifiedUser({
                verification_code_hash: codeHash,
                verification_expires_at: futureDate(),
                verification_attempts: 5
            }));

            const response = await request(app)
                .post("/api/auth/verify-email")
                .send({ email: "dr.silva@forensic.gov", code: "123456" });

            expect(response.status).toBe(429);
            expect(markEmailVerifiedSpy).not.toHaveBeenCalled();
        });

        test("16. Should not reveal whether an account exists when resending", async () => {
            getUserByEmailSpy.mockResolvedValue(undefined);

            const response = await request(app)
                .post("/api/auth/resend-verification")
                .send({ email: "nobody@forensic.gov" });

            expect(response.status).toBe(200);
            expect(setVerificationCodeSpy).not.toHaveBeenCalled();
        });

        test("17. Should throttle rapid resend requests", async () => {
            getUserByEmailSpy.mockResolvedValue(unverifiedUser({
                verification_sent_at: new Date()
            }));

            const response = await request(app)
                .post("/api/auth/resend-verification")
                .send({ email: "dr.silva@forensic.gov" });

            expect(response.status).toBe(429);
            expect(setVerificationCodeSpy).not.toHaveBeenCalled();
        });
    });

    describe("Forgot / reset password", () => {
        const futureDate = () => new Date(Date.now() + 10 * 60 * 1000);

        const resetUser = (overrides = {}) => ({
            id: "USR-2000",
            name: "Dr. Silva",
            role: "doctor",
            email: "dr.silva@forensic.gov",
            password_hash: hashedPassword,
            email_verified: true,
            reset_attempts: 0,
            ...overrides
        });

        test("18. Should email a reset code to a registered address", async () => {
            getUserByEmailSpy.mockResolvedValue(resetUser());

            const response = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "dr.silva@forensic.gov" });

            expect(response.status).toBe(200);
            expect(setResetCodeSpy).toHaveBeenCalled();
            // The code itself must never appear in the response body
            expect(JSON.stringify(response.body)).not.toMatch(/\d{6}/);
        });

        test("19. Should not reveal whether an account exists", async () => {
            getUserByEmailSpy.mockResolvedValue(undefined);

            const unknown = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "nobody@forensic.gov" });

            getUserByEmailSpy.mockResolvedValue(resetUser());
            const known = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "dr.silva@forensic.gov" });

            expect(unknown.status).toBe(200);
            expect(known.status).toBe(200);
            expect(unknown.body.message).toBe(known.body.message);
        });

        test("20. Should throttle rapid reset requests", async () => {
            getUserByEmailSpy.mockResolvedValue(resetUser({ reset_sent_at: new Date() }));

            const response = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "dr.silva@forensic.gov" });

            expect(response.status).toBe(429);
            expect(setResetCodeSpy).not.toHaveBeenCalled();
        });

        test("21. Should reset the password with a valid code", async () => {
            const codeHash = await bcrypt.hash("654321", 10);
            getUserByEmailSpy.mockResolvedValue(resetUser({
                reset_code_hash: codeHash,
                reset_expires_at: futureDate()
            }));

            const response = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: "dr.silva@forensic.gov", code: "654321", newPassword: "NewPassw0rd!" });

            expect(response.status).toBe(200);
            expect(updatePasswordSpy).toHaveBeenCalled();

            // The stored value must be a bcrypt hash, never the raw password
            const [, storedHash] = updatePasswordSpy.mock.calls[0];
            expect(storedHash).not.toBe("NewPassw0rd!");
            expect(await bcrypt.compare("NewPassw0rd!", storedHash)).toBe(true);

            // No session is handed out by the reset itself
            expect(response.body).not.toHaveProperty("token");
        });

        test("22. Should reject an incorrect reset code and count the attempt", async () => {
            const codeHash = await bcrypt.hash("654321", 10);
            getUserByEmailSpy.mockResolvedValue(resetUser({
                reset_code_hash: codeHash,
                reset_expires_at: futureDate()
            }));

            const response = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: "dr.silva@forensic.gov", code: "000000", newPassword: "NewPassw0rd!" });

            expect(response.status).toBe(400);
            expect(updatePasswordSpy).not.toHaveBeenCalled();
            expect(incrementResetAttemptsSpy).toHaveBeenCalledWith("dr.silva@forensic.gov");
        });

        test("23. Should reject an expired reset code", async () => {
            const codeHash = await bcrypt.hash("654321", 10);
            getUserByEmailSpy.mockResolvedValue(resetUser({
                reset_code_hash: codeHash,
                reset_expires_at: new Date(Date.now() - 60 * 1000)
            }));

            const response = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: "dr.silva@forensic.gov", code: "654321", newPassword: "NewPassw0rd!" });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/expired/i);
            expect(updatePasswordSpy).not.toHaveBeenCalled();
        });

        test("24. Should lock out after too many incorrect reset attempts", async () => {
            const codeHash = await bcrypt.hash("654321", 10);
            getUserByEmailSpy.mockResolvedValue(resetUser({
                reset_code_hash: codeHash,
                reset_expires_at: futureDate(),
                reset_attempts: 5
            }));

            const response = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: "dr.silva@forensic.gov", code: "654321", newPassword: "NewPassw0rd!" });

            expect(response.status).toBe(429);
            expect(updatePasswordSpy).not.toHaveBeenCalled();
        });

        test("25. Should reject a password below the minimum length", async () => {
            const codeHash = await bcrypt.hash("654321", 10);
            getUserByEmailSpy.mockResolvedValue(resetUser({
                reset_code_hash: codeHash,
                reset_expires_at: futureDate()
            }));

            const response = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: "dr.silva@forensic.gov", code: "654321", newPassword: "123" });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/at least 8 characters/i);
            expect(updatePasswordSpy).not.toHaveBeenCalled();
        });

        test("26. Should reject a reset when no code was ever requested", async () => {
            // Guards against resetting a password with a guessed code alone
            getUserByEmailSpy.mockResolvedValue(resetUser({
                reset_code_hash: null,
                reset_expires_at: null
            }));

            const response = await request(app)
                .post("/api/auth/reset-password")
                .send({ email: "dr.silva@forensic.gov", code: "654321", newPassword: "NewPassw0rd!" });

            expect(response.status).toBe(400);
            expect(updatePasswordSpy).not.toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/register", () => {
        test("5. Should reject registration request without authentication", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    id: "USR-1001",
                    email: "new.user@forensic.gov",
                    password: "password123"
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Access denied. No token provided.");
        });

        test("6. Should allow admin to register a new user successfully", async () => {
            const mockNewUser = {
                id: "USR-1001",
                name: "Dr. Perera II",
                role: "doctor",
                email: "dr.perera2@forensic.gov",
                phone: "0771234567",
                designation: "Medical Officer",
                profile_picture_url: null
            };

            // Setup mock spies
            getUserByEmailSpy.mockResolvedValue(undefined); // user doesn't exist yet
            createUserSpy.mockResolvedValue(mockNewUser);

            const adminToken = jwt.sign(
                { id: "USR-1000", role: "admin", name: "Dr. Perera" },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" }
            );

            const response = await request(app)
                .post("/api/auth/register")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    id: "USR-1001",
                    name: "Dr. Perera II",
                    role: "doctor",
                    designation: "Medical Officer",
                    email: "dr.perera2@forensic.gov",
                    phone: "0771234567",
                    password: "password123",
                    profilePictureUrl: null
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockNewUser);
            expect(getUserByEmailSpy).toHaveBeenCalledWith("dr.perera2@forensic.gov");
            expect(createUserSpy).toHaveBeenCalled();
        });

        test("7. Should reject registration if email already exists", async () => {
            const mockExistingUser = {
                id: "USR-1000",
                email: "dr.perera@forensic.gov"
            };

            getUserByEmailSpy.mockResolvedValue(mockExistingUser);

            const adminToken = jwt.sign(
                { id: "USR-1000", role: "admin", name: "Dr. Perera" },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" }
            );

            const response = await request(app)
                .post("/api/auth/register")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    id: "USR-1001",
                    name: "Dr. Perera II",
                    role: "doctor",
                    designation: "Medical Officer",
                    email: "dr.perera@forensic.gov",
                    phone: "0771234567",
                    password: "password123",
                    profilePictureUrl: null
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("User already exists");
        });

        test("8. Should reject registration if authenticated user is not admin", async () => {
            const doctorToken = jwt.sign(
                { id: "USR-1002", role: "doctor", name: "Dr. Hansara" },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" }
            );

            const response = await request(app)
                .post("/api/auth/register")
                .set("Authorization", `Bearer ${doctorToken}`)
                .send({
                    id: "USR-1003",
                    email: "new.doctor@forensic.gov",
                    password: "password123"
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Access denied. Admins only.");
        });
    });

    describe("GET /api/auth/users", () => {
        test("9. Should reject fetching users without token", async () => {
            const response = await request(app)
                .get("/api/auth/users");

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Access denied. No token provided.");
        });

        test("10. Should return all users when authenticated as admin", async () => {
            const mockUsers = [
                { id: "USR-1000", name: "Dr. Perera", role: "admin", email: "dr.perera@forensic.gov", password_hash: "secret" },
                { id: "USR-1002", name: "Dr. Hansara", role: "doctor", email: "dr.hansara@forensic.gov", password_hash: "secret" }
            ];

            getAllUsersSpy.mockResolvedValue(mockUsers);

            // Generate a valid admin token
            const adminToken = jwt.sign(
                { id: "USR-1000", role: "admin", name: "Dr. Perera" },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" }
            );

            const response = await request(app)
                .get("/api/auth/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            // Verify password hashes are stripped out
            expect(response.body[0]).not.toHaveProperty("password_hash");
            expect(response.body[0].email).toBe("dr.perera@forensic.gov");
        });
    });
});
