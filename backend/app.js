import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import Routes
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

// Sanitization middleware to convert empty strings to null in req.body
app.use((req, res, next) => {
    if (req.body) {
        const sanitize = (obj) => {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj === 'string') {
                return obj.trim() === '' ? null : obj;
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitize);
            }
            if (typeof obj === 'object') {
                const newObj = {};
                for (const key of Object.keys(obj)) {
                    newObj[key] = sanitize(obj[key]);
                }
                return newObj;
            }
            return obj;
        };
        req.body = sanitize(req.body);
    }
    next();
});

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/mlef", mlefRoutes);
app.use("/api/mlr", mlrRoutes);
app.use("/api/pmr", pmrRoutes);
app.use("/api/lab", labRoutes);

// Catch-all error handler. Any error thrown in a route that is not handled by
// that route's own try/catch ends up here, so it is always logged with the
// request that caused it instead of silently hanging or returning an empty body.
// Must be registered last, and must take four arguments for Express to treat it
// as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        message: "Server error. Check the server console for details."
    });
});

export default app;
