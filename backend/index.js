import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import Routes
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import mlefRoutes from "./routes/mlefRoutes.js";
import mlrRoutes from "./routes/mlrRoutes.js";
import pmrRoutes from "./routes/pmrRoutes.js";
import labRoutes from "./routes/labRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/mlef", mlefRoutes);
app.use("/api/mlr", mlrRoutes);
app.use("/api/pmr", pmrRoutes);
app.use("/api/lab", labRoutes);

// Test database connection
pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL successfully");
        client.release();
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });

app.listen(3000, () => {
    console.log("Server started successfully");
    console.log("Listening on port 3000");
});

export default pool;