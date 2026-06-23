import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserModel from "../models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

// Register a new user
export const registerUser = async (req, res) => {
    try {
        // Only allow admins to register new users
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { id, name, role, designation, email, phone, password } = req.body;

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
            id, name, role, designation, email, phone, passwordHash
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

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                designation: user.designation,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
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
        res.status(500).json({ message: "Server error fetching users" });
    }
};